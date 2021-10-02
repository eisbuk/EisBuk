/* eslint-disable camelcase */
import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { Timestamp } from "@google-cloud/firestore";
import { DateTime } from "luxon";
import _ from "lodash";
import { v4 } from "uuid";

import {
  Category,
  Collection,
  Customer,
  FIRST_NAMES,
  LAST_NAMES,
  OrgSubCollection,
  SlotType,
} from "eisbuk-shared";

import { checkUser } from "./utils";
import {
  DeprecatedBookingsMeta,
  DeprecatedOrgSubCollection,
  DeprecatedSlotInterface,
} from "eisbuk-shared/dist/deprecated";

const uuidv4 = v4;

interface Payload {
  numUsers: number;
  organization: string;
}

/**
 * Creates entries belonging to deprecated data model, used to test migrations
 */
export const createOldDataModelEntries = functions
  .region("europe-west6")
  .https.onCall(async ({ numUsers = 1, organization }: Payload, context) => {
    await checkUser(organization, context.auth);

    const baseSlot = {
      categories: [Category.Course],
      date: Timestamp.now(),
      type: SlotType.Ice,
      durations: ["120"],
      notes: "",
    };

    const dummySlots: Record<string, DeprecatedSlotInterface> = {
      ["slot-0"]: {
        ...baseSlot,
        id: "slot-0",
      },
      ["slot-1"]: {
        ...baseSlot,
        id: "slot-1",
      },
    };

    await Promise.all(
      Object.keys(dummySlots).map((slotId) =>
        admin
          .firestore()
          .collection(Collection.Organizations)
          .doc(organization)
          .collection(OrgSubCollection.Slots)
          .doc(slotId)
          .set(dummySlots[slotId])
      )
    );

    await createOldDMUsersAndBookings(numUsers, organization, dummySlots);

    return { success: true };
  });

/**
 * Creates provided number of users and adds them as customers to provided organization
 * @param numUsers
 * @param organization
 */
export const createOldDMUsersAndBookings = async (
  numUsers: number,
  organization: string,
  slots: Record<string, DeprecatedSlotInterface>
): Promise<void> => {
  const db = admin.firestore();
  const org = db.collection(Collection.Organizations).doc(organization);

  _.range(numUsers).map(async () => {
    const name = _.sample(FIRST_NAMES)!;
    const surname = _.sample(LAST_NAMES)!;
    const secret_key = uuidv4();
    const customerId = uuidv4();
    const customerBase: Omit<DeprecatedBookingsMeta, "customer_id"> = {
      name,
      surname,
      category: Category.Course,
    };
    const customer: Omit<Customer, "secretKey"> & { secret_key: string } = {
      ...customerBase,
      id: customerId,
      secret_key,
      birthday: "2000-01-01",
      email: toEmail(`${name}.${surname}@example.com`.toLowerCase()),
      phone: "12345",
      certificateExpiration: DateTime.local()
        .plus({ days: _.random(-40, 200) })
        .toISODate(),
      covidCertificateReleaseDate: DateTime.local()
        .plus({ days: _.random(-500, 0) })
        .toISODate(),
      covidCertificateSuspended: _.sample([true, false])!,
    };

    // `bookings` entry for customer ref
    const bookingRef = org
      .collection(OrgSubCollection.Bookings)
      .doc(secret_key);

    const bookingUpdates = Object.values(slots).reduce((acc, slot) => {
      // we're adding the same duration for everyone as it's arbitrary
      const duration = "120";
      const bookingEntry = { ...slot, duration };
      // (manually) create an entry for `bookingsByDay`, as the data trigger was deprecated and we're testing the deletion
      const slotIsoDate = DateTime.fromJSDate(slot.date.toDate()).toISODate();
      const monthStr = slotIsoDate.substr(0, 7);
      const bookingsByDayEntry = {
        [slotIsoDate]: {
          [slot.id]: {
            [customerId]: duration,
          },
        },
      };
      return [
        ...acc,
        // set booking entry
        bookingRef.collection("data").doc(slot.id).set(bookingEntry),
        // update `bookingsByDay`
        org
          .collection(DeprecatedOrgSubCollection.BookingsByDay)
          .doc(monthStr)
          .set(bookingsByDayEntry, { merge: true }),
      ];
    }, [] as Promise<any>[]);

    await Promise.all([
      org.collection(OrgSubCollection.Customers).doc(customer.id).set(customer),
      // we're manually creating a customer's entry in `bookings` collection
      // one will already be created by the data trigger, but that one will be new (proper) data model
      org
        .collection(OrgSubCollection.Bookings)
        .doc(secret_key)
        .set({ ...customerBase, customer_id: customerId }),
      ...bookingUpdates,
    ]);
  });
};

/**
 * Creates email friendly string from provided str parameter
 * @param str string to convert to email
 * @returns email friendly string
 */
const toEmail = (str: string): string => _.deburr(str.replace(/ /i, "."));

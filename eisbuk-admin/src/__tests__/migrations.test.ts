import firebase from "firebase/app";
import "@/tests/settings";

import { Collection, OrgSubCollection } from "eisbuk-shared";
import { DeprecatedOrgSubCollection } from "eisbuk-shared/dist/deprecated";

import { functionsZone, ORGANIZATION } from "@/config/envInfo";

import { CloudFunction } from "@/enums/functions";

import { deleteAll } from "@/tests/utils";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { getFirebase } from "@/__testUtils__/firestore";

import {
  emptyMonth,
  emptyMonthString,
  migratedCustomers,
  mixedSlots,
  newCustomerBase,
  oldCustomerBase,
  oldCustomers,
  prunedMonth,
  pruningMonthString,
  testBookingData,
  testBookingsByDay,
  unprunedMonth,
} from "../__testData__/migrations";
import { walt } from "@/__testData__/customers";

const db = getFirebase().firestore();

export const invokeFunction = (functionName: string) => (): Promise<any> =>
  firebase.app().functions(functionsZone).httpsCallable(functionName)({
    organization: ORGANIZATION,
  });

/**
 * Document ref to test organization, to save excess typing
 */
const orgRef = db.collection(Collection.Organizations).doc(ORGANIZATION);

describe("Migrations", () => {
  afterEach(async () => {
    await deleteAll([
      OrgSubCollection.Slots,
      OrgSubCollection.Customers,
      OrgSubCollection.Bookings,
    ]);
  });

  describe("'migrateToNewDataModel'", () => {
    testWithEmulator(
      "should delete old slots from firestore, leaving the new ones intact",
      async () => {
        const slotsRef = orgRef.collection(OrgSubCollection.Slots);
        // set up test state
        const initialSlots = Object.keys(mixedSlots).map(
          (slotId) => slotsRef.doc(slotId).set(mixedSlots[slotId])
          //
        );
        await Promise.all(initialSlots);
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check updated slots
        const updatedSlots = await slotsRef.get();
        // only the one slot (of new interface) should remain
        expect(updatedSlots.docs.length).toEqual(1);
      }
    );

    testWithEmulator(
      "should delete old bookings from firestore (data collection within customer's bookings)",
      async () => {
        // set up test state
        const waltsBookings = orgRef
          .collection(OrgSubCollection.Bookings)
          .doc(walt.secretKey);
        await waltsBookings.set(migratedCustomers.walt);
        await Promise.all(
          Object.keys(testBookingData).map((slotId) =>
            waltsBookings
              .collection("data")
              .doc(slotId)
              .set(testBookingData[slotId])
          )
        );
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check that the `bookings.data` was deleted
        const updatedWaltsBookings = await waltsBookings
          .collection("data")
          .get();
        expect(updatedWaltsBookings.empty).toEqual(true);
      }
    );

    testWithEmulator(
      "should migrate booking info for each custoemr to use 'id' instead of 'customer_id'",
      async () => {
        const bookingsRef = orgRef.collection(OrgSubCollection.Bookings);
        // set up test state
        const initialBookings = Object.keys(migratedCustomers).map(
          (customerId) => {
            const { secretKey } = migratedCustomers[customerId];
            return bookingsRef.doc(secretKey).set(oldCustomerBase[customerId]);
          }
        );
        await Promise.all(initialBookings);
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check updated customers' bookings
        const updatedBookings = await bookingsRef.get();
        updatedBookings.forEach((bookingSnapshot) => {
          const {
            // eslint-disable-next-line camelcase
            customer_id,
            ...updatedCustomerBase
          } = bookingSnapshot.data();
          // no updated booking for customer should have `customer_id`
          expect(customer_id).not.toBeDefined();
          expect(updatedCustomerBase).toEqual(
            newCustomerBase[updatedCustomerBase.id]
          );
        });
      }
    );

    testWithEmulator("should delete all bookingsByDay", async () => {
      const bookingsByDayRef = orgRef.collection(
        DeprecatedOrgSubCollection.BookingsByDay
      );
      // set up test state
      await bookingsByDayRef.doc("2020-03").set(testBookingsByDay);
      // fire migration function
      await invokeFunction(CloudFunction.MigrateToNewDataModel)();
      // check that the bookings are deleted
      const updatedBookingsByDay = await bookingsByDayRef.get();
      expect(updatedBookingsByDay.empty).toEqual(true);
    });

    testWithEmulator(
      "should migrate customer data to use 'secretKey' instead of 'secret_key'",
      async () => {
        const customersRef = orgRef.collection(OrgSubCollection.Customers);
        // set up test state
        const initialCustomers = Object.keys(oldCustomers).map((customerId) =>
          customersRef.doc(customerId).set(oldCustomers[customerId])
        );
        await Promise.all(initialCustomers);
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check updated customers
        const updatedCustomers = await customersRef.get();
        updatedCustomers.forEach((customerSnapshot) => {
          // eslint-disable-next-line camelcase
          const { secret_key, ...updatedCustomer } = customerSnapshot.data();
          // no updated customer should have `secret_key`
          expect(secret_key).not.toBeDefined();
          expect(updatedCustomer).toEqual(
            migratedCustomers[updatedCustomer.id]
          );
        });
      }
    );
  });

  describe("'pruneSlotsByDay'", () => {
    testWithEmulator(
      "should delete all 'slotsByDay' entries not containing any slots",
      async () => {
        const slotsByDayRef = orgRef.collection(OrgSubCollection.SlotsByDay);
        // set up initial state
        await slotsByDayRef.doc(pruningMonthString).set(unprunedMonth);
        await slotsByDayRef.doc(emptyMonthString).set(emptyMonth);
        // run the migration
        await invokeFunction(CloudFunction.PruneSlotsByDay)();
        // there should only be one month entry in 'slotsByDay' (an empty month should be deleted)
        const slotsByDay = await slotsByDayRef.get();
        expect(slotsByDay.docs.length).toEqual(1);
        // check the non empty month being pruned accordingly
        const pruningMonth = await slotsByDayRef.doc(pruningMonthString).get();
        expect(pruningMonth.data()).toEqual(prunedMonth);
      }
    );
  });
});

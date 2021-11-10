import { httpsCallable } from "@firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from "@firebase/firestore";

import { Collection, OrgSubCollection } from "eisbuk-shared";
import { DeprecatedOrgSubCollection } from "eisbuk-shared/dist/deprecated";

import { functions } from "@/__testSettings__";

import { CloudFunction } from "@/enums/functions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deleteAll } from "@/__testUtils__/firestore";

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
import { getOrganization } from "@/lib/getters";

const organization = getOrganization();

export const invokeFunction = (functionName: string) => (): Promise<any> =>
  httpsCallable(
    functions,
    functionName
  )({
    organization,
  });

const db = getFirestore();
const orgDocPath = `${Collection.Organizations}/${organization}`;

describe("Migrations", () => {
  afterEach(async () => {
    await deleteAll([
      OrgSubCollection.Slots,
      OrgSubCollection.Bookings,
      DeprecatedOrgSubCollection.BookingsByDay,
      OrgSubCollection.SlotsByDay,
    ]);
  });

  describe("'migrateToNewDataModel'", () => {
    testWithEmulator(
      "should delete old slots from firestore, leaving the new ones intact",
      async () => {
        const slotsCollPath = `${orgDocPath}/${OrgSubCollection.Slots}`;
        // set up test state
        const initialSlots = Object.keys(mixedSlots).map(
          (slotId) => {
            const docRef = doc(db, slotsCollPath, slotId);
            return setDoc(docRef, mixedSlots[slotId]);
          }
          //
        );
        await Promise.all(initialSlots);
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check updated slots
        const updatedSlots = await getDocs(collection(db, slotsCollPath));
        // only the one slot (of new interface) should remain
        expect(updatedSlots.docs.length).toEqual(1);
      }
    );

    testWithEmulator(
      "should delete old bookings from firestore (data collection within customer's bookings)",
      async () => {
        // set up test state
        const waltsBookingsPath = `${orgDocPath}/${OrgSubCollection.Bookings}/${walt.secretKey}`;
        const waltsBookingsDoc = doc(db, waltsBookingsPath);
        await setDoc(waltsBookingsDoc, migratedCustomers.walt);
        await Promise.all(
          Object.keys(testBookingData).map((slotId) => {
            const docRef = doc(db, waltsBookingsPath, "data", slotId);
            return setDoc(docRef, testBookingData[slotId]);
          })
        );
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check that the `bookings.data` was deleted
        const updatedBookingsDataRef = collection(
          db,
          waltsBookingsPath,
          "data"
        );
        const updatedWaltsBookings = await getDocs(updatedBookingsDataRef);
        expect(updatedWaltsBookings.empty).toEqual(true);
      }
    );

    testWithEmulator(
      "should migrate booking info for each custoemr to use 'id' instead of 'customer_id'",
      async () => {
        const collPath = `${orgDocPath}/${OrgSubCollection.Bookings}`;
        const bookingsRef = collection(db, collPath);
        // set up test state
        const initialBookings = Object.keys(migratedCustomers).map(
          (customerId) => {
            const { secretKey } = migratedCustomers[customerId];
            const docRef = doc(db, collPath, secretKey);
            return setDoc(docRef, oldCustomerBase[customerId]);
          }
        );
        await Promise.all(initialBookings);
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check updated customers' bookings
        const updatedBookings = await getDocs(bookingsRef);
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
      const bookingsByDayPath = `${orgDocPath}/${DeprecatedOrgSubCollection.BookingsByDay}`;
      // set up test state
      const testDocRef = doc(db, bookingsByDayPath, "2020-03");
      await setDoc(testDocRef, testBookingsByDay);
      // fire migration function
      await invokeFunction(CloudFunction.MigrateToNewDataModel)();
      // check that the bookings are deleted
      const bookingsByDayRef = collection(db, bookingsByDayPath);
      const updatedBookingsByDay = await getDocs(bookingsByDayRef);
      expect(updatedBookingsByDay.empty).toEqual(true);
    });

    testWithEmulator(
      "should migrate customer data to use 'secretKey' instead of 'secret_key'",
      async () => {
        const customersCollPath = `${orgDocPath}/${OrgSubCollection.Customers}`;
        // set up test state
        const initialCustomers = Object.keys(oldCustomers).map((customerId) => {
          const docRef = doc(db, customersCollPath, customerId);
          return setDoc(docRef, oldCustomers[customerId]);
        });
        await Promise.all(initialCustomers);
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check updated customers
        const customersCollRef = collection(db, customersCollPath);
        const updatedCustomers = await getDocs(customersCollRef);
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
        const slotsByDayPath = `${orgDocPath}/${OrgSubCollection.SlotsByDay}`;
        // set up initial state
        const pruningMonthRef = doc(db, slotsByDayPath, pruningMonthString);
        const emptyMonthRef = doc(db, slotsByDayPath, emptyMonthString);
        await setDoc(pruningMonthRef, unprunedMonth);
        await setDoc(emptyMonthRef, emptyMonth);
        // run the migration
        await invokeFunction(CloudFunction.PruneSlotsByDay)();
        // there should only be one month entry in 'slotsByDay' (an empty month should be deleted)
        const slotsByDayCollRef = collection(db, slotsByDayPath);
        const slotsByDay = await getDocs(slotsByDayCollRef);
        expect(slotsByDay.docs.length).toEqual(1);
        // check the non empty month being pruned accordingly
        const pruningMonth = await getDoc(pruningMonthRef);
        expect(pruningMonth.data()).toEqual(prunedMonth);
      }
    );
  });
});

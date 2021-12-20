import { httpsCallable } from "@firebase/functions";

import { Collection, OrgSubCollection } from "eisbuk-shared";
import { DeprecatedOrgSubCollection } from "eisbuk-shared/dist/deprecated";

import { getOrganization } from "@/lib/getters";

import { functions, adminDb } from "@/__testSetup__/firestoreSetup";

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
import * as customers from "@/__testData__/customers";

const organization = getOrganization();

export const invokeFunction = (functionName: string) => (): Promise<any> =>
  httpsCallable(
    functions,
    functionName
  )({
    organization,
  });

const orgRef = adminDb.collection(Collection.Organizations).doc(organization);

describe("Migrations", () => {
  beforeEach(async () => {
    await deleteAll();
  });

  describe("'migrateToNewDataModel'", () => {
    testWithEmulator(
      "should delete old slots from firestore, leaving the new ones intact",
      async () => {
        const slotsCollRef = orgRef.collection(OrgSubCollection.Slots);
        // set up test state
        await Promise.all(
          Object.keys(mixedSlots).map((slotId) =>
            slotsCollRef.doc(slotId).set(mixedSlots[slotId])
          )
        );
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check updated slots
        const updatedSlots = await slotsCollRef.get();
        // only the one slot (of new interface) should remain
        expect(updatedSlots.docs.length).toEqual(1);
      }
    );

    testWithEmulator(
      "should delete old bookings from firestore (data collection within customer's bookings)",
      async () => {
        // set up test state
        const waltsBookingsRef = orgRef
          .collection(OrgSubCollection.Bookings)
          .doc(customers.walt.secretKey);
        await waltsBookingsRef.set(migratedCustomers.walt);
        await Promise.all(
          Object.keys(testBookingData).map((slotId) =>
            waltsBookingsRef
              .collection("data")
              .doc(slotId)
              .set(testBookingData[slotId])
          )
        );
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check that the `bookings.data` was deleted
        const updatedWaltsBookings = await waltsBookingsRef
          .collection("data")
          .get();
        expect(updatedWaltsBookings.empty).toEqual(true);
      }
    );

    testWithEmulator(
      "should migrate booking info for each customer to use 'id' instead of 'customer_id'",
      async () => {
        const bookingsRef = orgRef.collection(OrgSubCollection.Bookings);
        // set up test state
        await Promise.all(
          Object.keys(migratedCustomers).map((customerId) => {
            const { secretKey } = migratedCustomers[customerId];
            return bookingsRef.doc(secretKey).set(oldCustomerBase[customerId]);
          })
        );
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
        const customersCollRef = orgRef.collection(OrgSubCollection.Customers);
        // set up test state
        await Promise.all(
          Object.keys(oldCustomers).map((customerId) =>
            customersCollRef.doc(customerId).set(oldCustomers[customerId])
          )
        );
        // fire migration function
        await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // check updated customers
        const updatedCustomers = await customersCollRef.get();
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
        // set up initial stateconst pruningMonthRef = slotsByDayRef.doc(pruningMonthString);
        const pruningMonthRef = slotsByDayRef.doc(pruningMonthString);
        const emptyMonthRef = slotsByDayRef.doc(emptyMonthString);
        await pruningMonthRef.set(unprunedMonth);
        await emptyMonthRef.set(emptyMonth);
        // run the migration
        await invokeFunction(CloudFunction.PruneSlotsByDay)();
        // there should only be one month entry in 'slotsByDay' (an empty month should be deleted)
        const slotsByDay = await slotsByDayRef.get();
        expect(slotsByDay.docs.length).toEqual(1);
        // check the non empty month being pruned accordingly
        const pruningMonth = await pruningMonthRef.get();
        expect(pruningMonth.data()).toEqual(prunedMonth);
      }
    );
  });

  describe("'addIdsToCustomers'", () => {
    testWithEmulator(
      "should add document id's to customer entries as 'id' property",
      async () => {
        const customersCollRef = orgRef.collection(OrgSubCollection.Customers);
        // set up initial state
        await Promise.all(
          Object.values(customers).map(({ id, ...customer }) =>
            customersCollRef.doc(id).set(customer)
          )
        );
        // run migration
        await invokeFunction(CloudFunction.AddIdsToCustomers)();
        // check results
        const customersColl = await customersCollRef.get();
        customersColl.forEach(async (doc) => {
          const customer = doc.data();
          expect(customer.id).toEqual(doc.id);
        });
      }
    );
  });
});

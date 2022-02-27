import { httpsCallable, FunctionsError } from "@firebase/functions";
import { getAuth, signOut } from "@firebase/auth";

import {
  Collection,
  HTTPSErrors,
  OrgSubCollection,
  SlotType,
  getCustomerBase,
} from "eisbuk-shared";
import { DeprecatedSlotType } from "eisbuk-shared/dist/deprecated";

import { getOrganization } from "@/lib/getters";

import { functions, adminDb } from "@/__testSetup__/firestoreSetup";

import { CloudFunction } from "@/enums/functions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deleteAll } from "@/__testUtils__/firestore";

import {
  emptyMonth,
  emptyMonthString,
  prunedMonth,
  pruningMonthString,
  unprunedMonth,
} from "../__testData__/migrations";

import { waitForCondition } from "@/__testUtils__/helpers";
import { loginDefaultUser } from "@/__testUtils__/auth";

import * as customers from "@/__testData__/customers";
import { baseSlot } from "@/__testData__/slots";

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
    await loginDefaultUser();
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

    testWithEmulator("should not allow access to unauth users", async () => {
      await signOut(getAuth());
      try {
        await invokeFunction(CloudFunction.PruneSlotsByDay)();
      } catch (err) {
        expect((err as FunctionsError).code).toEqual(
          "functions/permission-denied"
        );
      }
    });
  });

  /**
   * @TEMP The tests down below are flaky for some reason and are skipped not to waste any more time
   * on a feature which will probably be ran twice during the duration of the project.
   * We can quickly revisit this when doing test chores, if not, it can easily be deleted.
   */
  xdescribe("'deleteOrphanedBookings'", () => {
    testWithEmulator(
      "should remove bookings without customer entries",
      async () => {
        const { saul, jian } = customers;
        const orgRef = adminDb
          .collection(Collection.Organizations)
          .doc(getOrganization());
        const bookingsRef = orgRef.collection(OrgSubCollection.Bookings);
        const customersRef = orgRef.collection(OrgSubCollection.Customers);
        // set customer to store (to create a regular booking)
        await customersRef.doc(saul.id).set(saul);
        // wait for saul's booking to get created
        await waitForCondition({
          condition: (data) => Boolean(data),
          documentPath: `${Collection.Organizations}/${getOrganization()}/${
            OrgSubCollection.Bookings
          }/${saul.secretKey}`,
        });
        // add additional bookings (without customer)
        await bookingsRef.doc(jian.secretKey).set(getCustomerBase(jian));
        // run migration
        await invokeFunction(CloudFunction.DeleteOrphanedBookings)();
        // check results
        const bookingsColl = await bookingsRef.get();
        const bookingsDocs = bookingsColl.docs;
        // only saul's bookings should remain
        expect(bookingsDocs.length).toEqual(1);
        expect(bookingsDocs[0].data()).toEqual(getCustomerBase(saul));
      }
    );

    testWithEmulator("should not allow calls to non-admin", async () => {
      await signOut(getAuth());
      await expect(
        invokeFunction(CloudFunction.DeleteOrphanedBookings)()
      ).rejects.toThrow(HTTPSErrors.Unauth);
    });
  });

  describe("'unifyOffIceLabels'", () => {
    testWithEmulator(
      "should replace all 'off-ice-*' slot types with single 'off-ice'",
      async () => {
        const slotsRef = orgRef.collection(OrgSubCollection.Slots);
        // create one slot in firestore entry for each of deprecated types
        const initialSlotUpdates = Object.values(DeprecatedSlotType).map(
          (type) =>
            slotsRef.doc().set({
              ...baseSlot,
              id: `${type}-slot`,
              type,
            })
        );
        await Promise.all(initialSlotUpdates);
        // run migration
        await invokeFunction(CloudFunction.UnifyOffIceLabels)();
        // "ice" slot should be intact, while off-ice-* types should be the same ("off-ice") type
        const iceSlots = await slotsRef.where("type", "==", SlotType.Ice).get();
        expect(iceSlots.docs.length).toEqual(1);
        const offIceSlots = await slotsRef
          .where("type", "==", SlotType.OffIce)
          .get();
        expect(offIceSlots.docs.length).toEqual(2);
      }
    );

    testWithEmulator("should not allow access to unauth users", async () => {
      await signOut(getAuth());
      try {
        await invokeFunction(CloudFunction.UnifyOffIceLabels)();
      } catch (err) {
        expect((err as FunctionsError).code).toEqual(
          "functions/permission-denied"
        );
      }
    });
  });
});

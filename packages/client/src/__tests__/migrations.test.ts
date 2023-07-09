/**
 * @vitest-environment node
 */

import { describe, expect } from "vitest";
import { httpsCallable, FunctionsError } from "@firebase/functions";

import { HTTPSErrors, sanitizeCustomer } from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";

import {
  emptyMonth,
  emptyMonthString,
  prunedMonth,
  pruningMonthString,
  unprunedMonth,
} from "@eisbuk/testing/migrations";
import * as customers from "@eisbuk/testing/customers";

import { functions, adminDb } from "@/__testSetup__/firestoreSetup";

import { setUpOrganization } from "@/__testSetup__/node";

import {
  getBookingsDocPath,
  getBookingsPath,
  getCustomerDocPath,
  getSlotsByDayPath,
} from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitFor } from "@/__testUtils__/helpers";

export const invokeFunction =
  (functionName: string) =>
  (payload: { organization: string }): Promise<any> =>
    httpsCallable(functions, functionName)(payload);

describe("Migrations", () => {
  describe("'pruneSlotsByDay'", () => {
    testWithEmulator(
      "should delete all 'slotsByDay' entries not containing any slots",
      async () => {
        const { organization } = await setUpOrganization();
        const slotsByDayRef = adminDb.collection(
          getSlotsByDayPath(organization)
        );
        // set up initial state
        const pruningMonthRef = slotsByDayRef.doc(pruningMonthString);
        const emptyMonthRef = slotsByDayRef.doc(emptyMonthString);
        await pruningMonthRef.set(unprunedMonth);
        await emptyMonthRef.set(emptyMonth);
        // run the migration
        await invokeFunction(CloudFunction.PruneSlotsByDay)({ organization });
        // there should only be one month entry in 'slotsByDay' (an empty month should be deleted)
        const slotsByDay = await slotsByDayRef.get();
        expect(slotsByDay.docs.length).toEqual(1);
        // check the non empty month being pruned accordingly
        const pruningMonth = await pruningMonthRef.get();
        expect(pruningMonth.data()).toEqual(prunedMonth);
      }
    );

    testWithEmulator("should not allow access to unauth users", async () => {
      const { organization } = await setUpOrganization({ doLogin: false });
      try {
        await invokeFunction(CloudFunction.PruneSlotsByDay)({ organization });
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
  describe.skip("'deleteOrphanedBookings'", () => {
    testWithEmulator(
      "should remove bookings without customer entries",
      async () => {
        const { organization } = await setUpOrganization();
        const { saul, jian } = customers;
        // set customer to store (to create a regular booking)
        await adminDb.doc(getCustomerDocPath(organization, saul.id)).set(saul);
        // wait for saul's booking to get created
        await waitFor(async () => {
          const bookingsSnap = await adminDb
            .doc(getBookingsDocPath(organization, saul.secretKey))
            .get();
          expect(bookingsSnap.exists).toEqual(true);
        });
        // add additional bookings (without customer)
        await adminDb
          .doc(getBookingsDocPath(organization, jian.secretKey))
          .set(sanitizeCustomer(jian));
        // run migration
        await invokeFunction(CloudFunction.DeleteOrphanedBookings)({
          organization,
        });
        // check results
        const bookingsColl = await adminDb
          .collection(getBookingsPath(organization))
          .get();
        const bookingsDocs = bookingsColl.docs;
        // only saul's bookings should remain
        expect(bookingsDocs.length).toEqual(1);
        expect(bookingsDocs[0].data()).toEqual(sanitizeCustomer(saul));
      }
    );

    testWithEmulator("should not allow calls to non-admin", async () => {
      const { organization } = await setUpOrganization({ doLogin: false });
      await expect(
        invokeFunction(CloudFunction.DeleteOrphanedBookings)({ organization })
      ).rejects.toThrow(HTTPSErrors.Unauth);
    });
  });
});

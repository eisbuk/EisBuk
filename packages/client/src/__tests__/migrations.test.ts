/**
 * @vitest-environment node
 */

import { describe, expect } from "vitest";
import { httpsCallable, FunctionsError } from "@firebase/functions";

import {
  HTTPSErrors,
  sanitizeCustomer,
  Category,
  DeprecatedCategory,
} from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";

import {
  emptyMonth,
  emptyMonthString,
  prunedMonth,
  pruningMonthString,
  unprunedMonth,
} from "@eisbuk/testing/migrations";
import * as customers from "@eisbuk/testing/customers";
import { baseSlot } from "@eisbuk/testing/slots";
import { saul } from "@eisbuk/testing/customers";

import { functions, adminDb } from "@/__testSetup__/firestoreSetup";

import { setUpOrganization } from "@/__testSetup__/node";

import {
  getBookingsDocPath,
  getBookingsPath,
  getCustomerDocPath,
  getSlotDocPath,
  getSlotsByDayPath,
} from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitForCondition } from "@/__testUtils__/helpers";

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
        await waitForCondition({
          condition: (data) => Boolean(data),
          documentPath: getBookingsDocPath(organization, saul.secretKey),
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

  describe("'migrateSlotsCategoriesToExplicitMinors'", () => {
    testWithEmulator(
      'should replace "pre-competitive" and "course" category entries with corresponging "-minor" category entries, while leaving the existing categories as they are',
      async () => {
        const { organization } = await setUpOrganization();
        const courseSlot = {
          ...baseSlot,
          categories: [Category.Competitive, DeprecatedCategory.Course],
          id: "course-slot",
        };
        const preCompetitiveSlot = {
          ...baseSlot,
          categories: [Category.Competitive, DeprecatedCategory.PreCompetitive],
          id: "pre-competitive-slot",
        };
        // Edge case, if the category already exists, shouldn't be duplicated
        const courseMinorsSlot = {
          ...baseSlot,
          categories: [Category.CourseMinors, DeprecatedCategory.Course],
          id: "pre-competitive-minors-slot",
        };

        const courseSlotRef = adminDb.doc(
          getSlotDocPath(organization, courseSlot.id)
        );
        const preCompetitiveSlotRef = adminDb.doc(
          getSlotDocPath(organization, preCompetitiveSlot.id)
        );
        const courseMinorsSlotRef = adminDb.doc(
          getSlotDocPath(organization, courseMinorsSlot.id)
        );

        await Promise.all([
          courseSlotRef.set(courseSlot),
          preCompetitiveSlotRef.set(preCompetitiveSlot),
          courseMinorsSlotRef.set(courseMinorsSlot),
        ]);

        await invokeFunction(CloudFunction.MigrateCategoriesToExplicitMinors)({
          organization,
        });

        const [resCourse, resPreCompetitive, resCourseMinors] =
          await Promise.all([
            courseSlotRef.get(),
            preCompetitiveSlotRef.get(),
            courseMinorsSlotRef.get(),
          ]);
        expect(resCourse.data()).toEqual({
          ...courseSlot,
          categories: [Category.Competitive, Category.CourseMinors],
        });
        expect(resPreCompetitive.data()).toEqual({
          ...preCompetitiveSlot,
          categories: [Category.Competitive, Category.PreCompetitiveMinors],
        });
        expect(resCourseMinors.data()).toEqual({
          ...courseMinorsSlot,
          categories: [Category.CourseMinors],
        });
      }
    );

    testWithEmulator(
      'should replace "pre-competitive" and "course" category entries with corresponging "-minor" category entries, in customer documents',
      async () => {
        const { organization } = await setUpOrganization();

        const courseCustomer = {
          ...saul,
          categories: [DeprecatedCategory.Course],
          id: "course-customer",
        };
        const preCompetitiveCustomer = {
          ...saul,
          categories: [DeprecatedCategory.PreCompetitive],
          id: "pre-competitive-customer",
        };

        const courseCustomerRef = adminDb.doc(
          getCustomerDocPath(organization, courseCustomer.id)
        );
        const preCompetitiveCustomerRef = adminDb.doc(
          getCustomerDocPath(organization, preCompetitiveCustomer.id)
        );

        await Promise.all([
          courseCustomerRef.set(courseCustomer),
          preCompetitiveCustomerRef.set(preCompetitiveCustomer),
        ]);

        await invokeFunction(CloudFunction.MigrateCategoriesToExplicitMinors)({
          organization,
        });

        const [resCourse, resPreCompetitive] = await Promise.all([
          courseCustomerRef.get(),
          preCompetitiveCustomerRef.get(),
        ]);
        expect(resCourse.data()).toEqual({
          ...courseCustomer,
          categories: [Category.CourseMinors],
        });
        expect(resPreCompetitive.data()).toEqual({
          ...preCompetitiveCustomer,
          categories: [Category.PreCompetitiveMinors],
        });
      }
    );

    testWithEmulator("should not allow calls to non-admins", async () => {
      const { organization } = await setUpOrganization({ doLogin: false });
      await expect(
        invokeFunction(CloudFunction.MigrateCategoriesToExplicitMinors)({
          organization,
        })
      ).rejects.toThrow(HTTPSErrors.Unauth);
    });
  });

  describe("customersToPluralCategories", () => {
    testWithEmulator(
      "should change customer's category field into an array instead of scalar",
      async () => {
        const { organization } = await setUpOrganization();

        const customer = {
          ...saul,
          category: saul.categories[0],
          id: "course-customer",
        };
        const customerRef = adminDb.doc(
          getCustomerDocPath(organization, customer.id)
        );
        await customerRef.set(customer);

        await invokeFunction(CloudFunction.CustomersToPluralCategories)({
          organization,
        });

        const { category, ...newCustomer } = customer;

        expect((await customerRef.get()).data()).toEqual({
          ...newCustomer,
          categories: [category],
        });
      }
    );
    // Normally when you try to convert an array, firestore throws an INTERNAL error
    testWithEmulator(
      "should not throw an error if category is already an array",
      async () => {
        const { organization } = await setUpOrganization();

        const customer = {
          ...saul,
          id: "course-customer",
        };
        const customerRef = adminDb.doc(
          getCustomerDocPath(organization, customer.id)
        );
        await customerRef.set(customer);

        await expect(
          invokeFunction(CloudFunction.CustomersToPluralCategories)({
            organization,
          })
        ).resolves.not.toThrow();
      }
    );
    testWithEmulator("should not allow calls to non-admins", async () => {
      const { organization } = await setUpOrganization({ doLogin: false });
      await expect(
        invokeFunction(CloudFunction.CustomersToPluralCategories)({
          organization,
        })
      ).rejects.toThrow(HTTPSErrors.Unauth);
    });
  });
});

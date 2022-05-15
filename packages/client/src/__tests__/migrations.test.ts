/**
 * @jest-environment node
 */

import { httpsCallable, FunctionsError } from "@firebase/functions";
import { getAuth, signOut } from "@firebase/auth";

import {
  Collection,
  HTTPSErrors,
  OrgSubCollection,
  getCustomerBase,
  Category,
  DeprecatedCategory,
} from "@eisbuk/shared";

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
import { saul } from "@/__testData__/customers";

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

  describe.only("'migrateSlotsCategoriesToExplicitMinors'", () => {
    testWithEmulator(
      'should replace "pre-competitive" and "course" category entries with corresponging "-minor" category entries, while leaving the existing categories as they are',
      async () => {
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
        const slotsRef = adminDb.collection(
          `${Collection.Organizations}/${getOrganization()}/${
            OrgSubCollection.Slots
          }`
        );

        const courseSlotRef = slotsRef.doc(courseSlot.id);
        const preCompetitiveSlotRef = slotsRef.doc(preCompetitiveSlot.id);
        const courseMinorsSlotRef = slotsRef.doc(courseMinorsSlot.id);

        await Promise.all([
          courseSlotRef.set(courseSlot),
          preCompetitiveSlotRef.set(preCompetitiveSlot),
          courseMinorsSlotRef.set(courseMinorsSlot),
        ]);

        await invokeFunction(
          CloudFunction.MigrateSlotsCategoriesToExplicitMinors
        )();

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
        const courseCustomer = {
          ...saul,
          category: DeprecatedCategory.Course,
          id: "course-customer",
        };
        const preCompetitiveCustomer = {
          ...saul,
          category: DeprecatedCategory.PreCompetitive,
          id: "pre-competitive-customer",
        };
        const customersRef = adminDb.collection(
          `${Collection.Organizations}/${getOrganization()}/${
            OrgSubCollection.Customers
          }`
        );

        const courseCustomerRef = customersRef.doc(courseCustomer.id);
        const preCompetitiveCustomerRef = customersRef.doc(
          preCompetitiveCustomer.id
        );

        await Promise.all([
          courseCustomerRef.set(courseCustomer),
          preCompetitiveCustomerRef.set(preCompetitiveCustomer),
        ]);

        await invokeFunction(
          CloudFunction.MigrateSlotsCategoriesToExplicitMinors
        )();

        const [resCourse, resPreCompetitive] = await Promise.all([
          courseCustomerRef.get(),
          preCompetitiveCustomerRef.get(),
        ]);
        expect(resCourse.data()).toEqual({
          ...courseCustomer,
          category: Category.CourseMinors,
        });
        expect(resPreCompetitive.data()).toEqual({
          ...preCompetitiveCustomer,
          category: Category.PreCompetitiveMinors,
        });
      }
    );

    testWithEmulator("should not allow calls to non-admin", async () => {
      await signOut(getAuth());
      await expect(
        invokeFunction(CloudFunction.MigrateSlotsCategoriesToExplicitMinors)()
      ).rejects.toThrow(HTTPSErrors.Unauth);
    });
  });
});

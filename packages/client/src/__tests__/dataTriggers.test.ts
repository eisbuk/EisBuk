/**
 * @jest-environment node
 */

import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
  Category,
  luxon2ISODate,
  SlotType,
  OrganizationData,
  getCustomerBase,
} from "@eisbuk/shared";

import { adminDb } from "@/__testSetup__/firestoreSetup";
import { getOrganization } from "@/lib/getters";

import { getDocumentRef, waitForCondition } from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deleteAll, deleteAllCollections } from "@/__testUtils__/firestore";

import {
  testBooking,
  attendanceWithTestCustomer,
  baseAttendance,
  emptyAttendance,
  organization,
} from "@/__testData__/dataTriggers";
import { saul } from "@/__testData__/customers";
import { baseSlot, createIntervals } from "@/__testData__/slots";
import { testDate, testDateLuxon } from "@/__testData__/date";
import { loginDefaultUser } from "@/__testUtils__/auth";

const slotId = baseSlot.id;
const customerId = saul.id;
const secretKey = saul.secretKey;
const customerBooking = getCustomerBase(saul);
const testMonth = testDate.substring(0, 7);

// document paths
const orgPath = `${Collection.Organizations}/${getOrganization()}`;
const publicOrgPath = `${Collection.PublicOrgInfo}/${getOrganization()}`;
const slotsCollectionPath = `${orgPath}/${OrgSubCollection.Slots}`;
const attendanceCollPath = `${orgPath}/${OrgSubCollection.Attendance}`;
const bookingsCollectionPath = `${orgPath}/${OrgSubCollection.Bookings}`;
const slotsByDayDocPath = `${orgPath}/${OrgSubCollection.SlotsByDay}/${testMonth}`;

// here we're using `adminDb` as direct writing to "(...)/bookings/{secretKey}"
// is blocked by firestore.rules (should only be written to by cloud functions)
// and this way we're bypassing firestore.rules check
const userBookingRef = getDocumentRef(
  adminDb,
  `${bookingsCollectionPath}/${secretKey}`
);


beforeEach(async () => {
  const clearAll = [
    deleteAllCollections(userBookingRef, [BookingSubCollection.BookedSlots]),
    deleteAll(),
  ];
  await Promise.all(clearAll);
  await loginDefaultUser();
});

describe("Cloud functions -> Data triggers ->,", () => {
  describe("createAttendanceForBooking", () => {
    testWithEmulator(
      "should create attendance entry for booking and not overwrite existing data in slot",
      async () => {
        // set up booking entry for customers booking info
        await userBookingRef.set(customerBooking);
        // set up dummy data in the same slot, not to be overwritten
        const attendanceDocRef = getDocumentRef(
          adminDb,
          `${attendanceCollPath}/${slotId}`
        );
        await attendanceDocRef.set(baseAttendance);
        // add new booking trying to trigger attendance entry
        const testBookingDocRef = getDocumentRef(
          adminDb,
          [
            bookingsCollectionPath,
            secretKey,
            BookingSubCollection.BookedSlots,
            slotId,
          ].join("/")
        );
        await testBookingDocRef.set(testBooking);
        // check proper updates triggerd by write to bookings
        const attendanceDocPath = `${attendanceCollPath}/${slotId}`;
        const docRes = await waitForCondition({
          documentPath: attendanceDocPath,
          condition: (data) => Boolean(data && data.attendances[customerId]),
        });
        expect(docRes).toEqual(attendanceWithTestCustomer);
        // test customer's attendnace being removed from slot's attendnace
        await testBookingDocRef.delete();
        const docRes2 = await waitForCondition({
          documentPath: attendanceDocPath,
          condition: (data) => Boolean(data && !data.attendances[customerId]),
        });
        // check that only the test customer's attendance's deleted, but not the rest of the data
        expect(docRes2).toEqual(baseAttendance);
      }
    );
  });

  describe("aggreagateSlots", () => {
    // prepare new slot test data for this block's tests
    const dayAfter = luxon2ISODate(testDateLuxon.plus({ days: 1 }));
    const newSlotId = "new-slot";
    const newSlot = { ...baseSlot, date: dayAfter, id: newSlotId };

    testWithEmulator(
      "should create slotsByDay entry for slot on create",
      async () => {
        // add new slot to trigger slot aggregation
        const slotRef = getDocumentRef(
          adminDb,
          `${slotsCollectionPath}/${slotId}`
        );
        await slotRef.set(baseSlot);
        // check that the slot has been aggregated to `slotsByDay`
        const expectedSlotsByDay = { [testDate]: { [baseSlot.id]: baseSlot } };
        const slotsByDayEntry = await waitForCondition({
          documentPath: slotsByDayDocPath,
          condition: (data) => Boolean(data && data[testDate]),
        });
        expect(slotsByDayEntry).toEqual(expectedSlotsByDay);
        // test adding another slot on different day of the same month
        const newSlotRef = getDocumentRef(
          adminDb,
          `${slotsCollectionPath}/${newSlotId}`
        );
        await newSlotRef.set(newSlot);
        const newSlotsByDayEntry = await waitForCondition({
          documentPath: slotsByDayDocPath,
          condition: (data) => Boolean(data && data[dayAfter]),
        });
        expect(newSlotsByDayEntry).toEqual({
          ...slotsByDayEntry,
          [dayAfter]: { [newSlotId]: newSlot },
        });
      }
    );

    testWithEmulator(
      "should update aggregated slotsByDay on slot update",
      async () => {
        // set up test state
        const slotRef = getDocumentRef(
          adminDb,
          `${slotsCollectionPath}/${slotId}`
        );
        await slotRef.set(baseSlot);
        await waitForCondition({
          documentPath: slotsByDayDocPath,
          condition: (data) => Boolean(data && data[testDate]),
        });
        // test slot updating
        const newIntervals = createIntervals(18);
        const updatedSlot = {
          ...baseSlot,
          intervals: newIntervals,
          type: SlotType.OffIce,
        };
        slotRef.set(updatedSlot);
        const expectedSlotsByDay = {
          [testDate]: { [baseSlot.id]: updatedSlot },
        };
        const updatedSlotsByDay = await waitForCondition({
          documentPath: slotsByDayDocPath,
          condition: (data) =>
            Boolean(data && data[testDate][slotId].type === updatedSlot.type),
        });
        expect(updatedSlotsByDay).toEqual(expectedSlotsByDay);
      }
    );

    testWithEmulator(
      "should remove slot from slotsByDay on slot delete",
      async () => {
        // set up test state
        const slotRef = getDocumentRef(
          adminDb,
          `${slotsCollectionPath}/${slotId}`
        );
        await slotRef.set(baseSlot);
        const newSlotRef = getDocumentRef(
          adminDb,
          `${slotsCollectionPath}/${newSlotId}`
        );
        await newSlotRef.set(newSlot);
        await waitForCondition({
          documentPath: slotsByDayDocPath,
          // wait until both slots are aggregated
          condition: (data) =>
            Boolean(data && data[testDate] && data[dayAfter]),
        });
        // test removing of the additional slot
        await newSlotRef.delete();
        await waitForCondition({
          documentPath: slotsByDayDocPath,
          condition: (data) => Boolean(data && !data[dayAfter][newSlotId]),
        });
      }
    );
  });

  describe("createAttendanceForSlot", () => {
    testWithEmulator(
      "should create attendance entry for slot (containing only the date) in 'attendance' collection, only on create slot (not on update)",
      async () => {
        // add new slot to trigger adding attendance for given slot
        const slotRef = getDocumentRef(
          adminDb,
          `${slotsCollectionPath}/${slotId}`
        );
        await slotRef.set(baseSlot);
        // check proper updates triggerd by write to slot
        const docRes = await waitForCondition({
          documentPath: `${attendanceCollPath}/${slotId}`,
          condition: (data) => Boolean(data),
        });
        expect(docRes).toEqual(emptyAttendance);
        // we're manually deleting attendance to test that it won't get created on slot update
        // the attendance entry for slot shouldn't be edited manually in production
        const attendanceDocRef = getDocumentRef(
          adminDb,
          `${attendanceCollPath}/${slotId}`
        );
        await attendanceDocRef.delete();
        // wait for attendance entry to be deleted
        // update the slot and expect new slot attendance entry not to be created
        await slotRef.set({
          ...baseSlot,
          intervals: {},
          categories: [Category.PreCompetitive],
        });
        // check the no new entry for slot attendance was created (on update)
        const slotAttendance = await attendanceDocRef.get();
        expect(slotAttendance.exists).toEqual(false);
      }
    );

    testWithEmulator(
      "should delete attendance entry for slot when the slot is deleted",
      async () => {
        // we're following the same setup from the test before
        const slotRef = getDocumentRef(
          adminDb,
          `${slotsCollectionPath}/${slotId}`
        );
        await slotRef.set(baseSlot);
        const attendanceDocPath = `${attendanceCollPath}/${slotId}`;
        await waitForCondition({
          documentPath: attendanceDocPath,
          condition: (data) => Boolean(data),
        });
        // delete the slot entry
        await slotRef.delete();
        // expect attendance to be deleted too
        await waitForCondition({
          documentPath: attendanceDocPath,
          condition: (data) => !data,
        });
      }
    );
  });

  describe("registerCreatedOrgSecret", () => {
    testWithEmulator(
      "should update 'existingSecrets' in organization data document when secrets get added or removed",
      async () => {
        // add new secret to trigger registering
        const orgSecretsRef = getDocumentRef(
          adminDb,
          `${Collection.Secrets}/${getOrganization()}`
        );
        await orgSecretsRef.set({ testSecret: "abc123" });
        // check proper updates triggerd by write to secrets
        let existingSecrets = (
          (await waitForCondition({
            documentPath: `${Collection.Organizations}/${getOrganization()}`,
            condition: (data) => Boolean(data?.existingSecrets.length),
          })) as OrganizationData
        ).existingSecrets;
        expect(existingSecrets).toEqual(["testSecret"]);

        // add another secret
        await orgSecretsRef.set({ anotherSecret: "abc234" }, { merge: true });
        existingSecrets = (
          (await waitForCondition({
            documentPath: `${Collection.Organizations}/${getOrganization()}`,
            condition: (data) => data?.existingSecrets.length === 2,
          })) as OrganizationData
        ).existingSecrets;
        expect(existingSecrets).toEqual(["testSecret", "anotherSecret"]);

        // removing one secret should remove it from array (without removing other secrets)
        await orgSecretsRef.set({ anotherSecret: "abc234" });
        existingSecrets = (
          (await waitForCondition({
            documentPath: `${Collection.Organizations}/${getOrganization()}`,
            condition: (data) => data?.existingSecrets.length === 1,
          })) as OrganizationData
        ).existingSecrets;
        expect(existingSecrets).toEqual(["anotherSecret"]);
      }
    );

    testWithEmulator(
      "should delete attendance entry for slot when the slot is deleted",
      async () => {
        // we're following the same setup from the test before
        const slotRef = getDocumentRef(
          adminDb,
          `${slotsCollectionPath}/${slotId}`
        );
        await slotRef.set(baseSlot);
        const attendanceDocPath = `${attendanceCollPath}/${slotId}`;
        await waitForCondition({
          documentPath: attendanceDocPath,
          condition: (data) => Boolean(data),
        });
        // delete the slot entry
        await slotRef.delete();
        // expect attendance to be deleted too
        await waitForCondition({
          documentPath: attendanceDocPath,
          condition: (data) => !data,
        });
      }
    );
  });
  describe("createPublicOrgInfo", () => {
    testWithEmulator(
      "should update/create general info in organization data to publicOrgInfo collection when organization data is updated",
      async () => {
        const { displayName, location, emailFrom } = organization;


        // check for non existence of publicOrgInfo before creating an organization
        const publicOrgRes = await waitForCondition({
          documentPath: publicOrgPath,
          condition: (data) => Boolean(!data),
        });
        expect(publicOrgRes).toBeUndefined();

        const orgRef = getDocumentRef(adminDb, orgPath);
        const OrgRes = await waitForCondition({
          documentPath: orgPath,
          condition: (data) => Boolean(data),
        });

        await orgRef.set(organization);
        const docRes = await waitForCondition({
          documentPath: publicOrgPath,
          condition: (data) => Boolean(data),
        });
        expect(docRes).toEqual({ displayName, location, emailFrom });
        // test removing of the public org info
        await orgRef.delete();
        await waitForCondition({
          documentPath: publicOrgPath,
          condition: (data) => Boolean(!data),
        });
      }
    );
  });
});

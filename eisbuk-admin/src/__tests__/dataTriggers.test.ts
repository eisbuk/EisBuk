import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
  Category,
  luxon2ISODate,
  SlotType,
} from "eisbuk-shared";

import { adminDb } from "@/__testSettings__";
import { ORGANIZATION } from "@/config/envInfo";

import {
  getDocumentRef,
  waitForCondition,
  getCustomerBase,
} from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deleteAll, deleteAllCollections } from "@/__testUtils__/firestore";

import {
  testBooking,
  attendanceWithTestCustomer,
  baseAttendance,
  emptyAttendance,
} from "@/__testData__/dataTriggers";
import { saul } from "@/__testData__/customers";
import { baseSlot, createIntervals } from "@/__testData__/slots";
import { testDate, testDateLuxon } from "@/__testData__/date";

const slotId = baseSlot.id;
const customerId = saul.id;
const secretKey = saul.secretKey;
const customerBooking = getCustomerBase(saul);
const testMonth = testDate.substr(0, 7);

// document paths
const orgPath = `${Collection.Organizations}/${ORGANIZATION}`;
const slotDocPath = `${orgPath}/${OrgSubCollection.Slots}/${slotId}`;
const attendanceDocPath = `${orgPath}/${OrgSubCollection.Attendance}/${slotId}`;
const userBookingDocPath = `${orgPath}/${OrgSubCollection.Bookings}/${secretKey}`;
const slotsByDayDocPath = `${orgPath}/${OrgSubCollection.SlotsByDay}/${testMonth}`;

// document refs
const userBookingRef = getDocumentRef(adminDb, userBookingDocPath);
const slotRef = getDocumentRef(adminDb, slotDocPath);
const slotAttendanceRef = getDocumentRef(adminDb, attendanceDocPath);

beforeEach(async () => {
  const clearAll = [
    deleteAllCollections(userBookingRef, [BookingSubCollection.BookedSlots]),
    deleteAll(),
  ];
  await Promise.all(clearAll);
});

describe("Cloud functions -> Data triggers ->,", () => {
  describe("createAttendanceForBooking", () => {
    testWithEmulator(
      "should create attendance entry for booking and not overwrite existing data in slot",
      async () => {
        // set up booking entry for customers booking info
        await userBookingRef.set(customerBooking);
        // set up dummy data in the same slot, not to be overwritten
        await slotAttendanceRef.set(baseAttendance);
        // add new booking trying to trigger attendance entry
        await userBookingRef
          .collection(BookingSubCollection.BookedSlots)
          .doc(slotId)
          .set(testBooking);
        // check proper updates triggerd by write to bookings
        const docRes = await waitForCondition({
          documentPath: attendanceDocPath,
          condition: (data) => Boolean(data && data.attendances[customerId]),
        });
        expect(docRes).toEqual(attendanceWithTestCustomer);
        // test customer's attendnace being removed from slot's attendnace
        await userBookingRef
          .collection(BookingSubCollection.BookedSlots)
          .doc(slotId)
          .delete();
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
    const newSlotDocPath = slotDocPath.replace(slotId, newSlotId);
    const newSlotRef = getDocumentRef(adminDb, newSlotDocPath);

    testWithEmulator(
      "should create slotsByDay entry for slot on create",
      async () => {
        // add new slot to trigger slot aggregation
        await slotRef.set(baseSlot);
        // check that the slot has been aggregated to `slotsByDay`
        const expectedSlotsByDay = { [testDate]: { [baseSlot.id]: baseSlot } };
        const slotsByDayEntry = await waitForCondition({
          documentPath: slotsByDayDocPath,
          condition: (data) => Boolean(data && data[testDate]),
        });
        expect(slotsByDayEntry).toEqual(expectedSlotsByDay);
        // test adding another slot on different day of the same month
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
          type: SlotType.OffIceDancing,
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
        await slotRef.set(baseSlot);
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
        await slotRef.set(baseSlot);
        // check proper updates triggerd by write to slot
        const docRes = await waitForCondition({
          documentPath: attendanceDocPath,
          condition: (data) => Boolean(data),
        });
        expect(docRes).toEqual(emptyAttendance);
        // we're manually deleting attendance to test that it won't get created on slot update
        // the attendance entry for slot shouldn't be edited manually in production
        await slotAttendanceRef.delete();
        // wait for attendance entry to be deleted
        // update the slot and expect new slot attendance entry not to be created
        await slotRef.set({
          ...baseSlot,
          intervals: {},
          categories: [Category.PreCompetitive],
        });
        // check the no new entry for slot attendance was created (on update)
        const slotAttendance = await slotAttendanceRef.get();
        expect(slotAttendance.exists).toEqual(false);
      }
    );

    testWithEmulator(
      "should delete attendance entry for slot when the slot is deleted",
      async () => {
        // we're following the same setup from the test before
        await slotRef.set(baseSlot);
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
});

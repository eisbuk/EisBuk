import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
  Category,
} from "eisbuk-shared";

import { adminDb } from "@/tests/settings";
import { ORGANIZATION } from "@/config/envInfo";

import {
  customerId,
  slotId,
  testBooking,
  attendanceWithTestCustomer,
  baseAttendance,
  secretKey,
  customerBooking,
  slot,
  emptyAttendance,
} from "@/__testData__/dataTriggers";

import { getDocumentRef, waitForCondition } from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deleteAll } from "@/tests/utils";

// document refs
const userBookingRef = getDocumentRef(
  adminDb,
  `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Bookings}/${secretKey}`
);
const attendanceDocPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Attendance}/${slotId}`;
const slotAttendanceRef = getDocumentRef(adminDb, attendanceDocPath);
const slotRef = getDocumentRef(
  adminDb,
  `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Slots}/${slotId}`
);

beforeEach(async () => {
  const clearAll = [
    deleteAll([OrgSubCollection.Bookings]),
    deleteAll([OrgSubCollection.Slots]),
    deleteAll([OrgSubCollection.Attendance]),
  ];
  await Promise.all(clearAll);
});

xdescribe("Cloud functions -> Data triggers ->,", () => {
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
        // test booking delete and removal from attendance trigger
        const res = await userBookingRef
          .collection(BookingSubCollection.BookedSlots)
          .doc(slotId)
          .delete();
        console.log(res);
        // test customer's attendnace being removed from slot's attendnace
        const docRes2 = await waitForCondition({
          documentPath: attendanceDocPath,
          condition: (data) => Boolean(data && !data.attendances[customerId]),
        });
        // check that only the test customer's attendance's deleted, but not the rest of the data
        expect(docRes2).toEqual(baseAttendance);
      }
    );
  });

  describe("createAttendanceForSlot", () => {
    testWithEmulator(
      "should create attendance entry for slot (containing only the date) in 'attendance' collection, only on create slot (not on update)",
      async () => {
        // add new slot to trigger adding attendance for given slot
        await slotRef.set(slot);
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
          ...slot,
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
        await slotRef.set(slot);
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

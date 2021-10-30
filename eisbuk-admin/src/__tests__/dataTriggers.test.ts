import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
  Category,
} from "eisbuk-shared";

import { adminDb } from "@/tests/settings";
import { ORGANIZATION } from "@/config/envInfo";

import {
  getDocumentRef,
  waitForCondition,
  getCustomerBase,
} from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deleteAll, deleteAllCollections } from "@/tests/utils";

import {
  testBooking,
  attendanceWithTestCustomer,
  baseAttendance,
  emptyAttendance,
} from "@/__testData__/dataTriggers";
import { saul } from "@/__testData__/customers";
import { baseSlot } from "@/__testData__/slots";

const slotId = baseSlot.id;
const customerId = saul.id;
const secretKey = saul.secretKey;
const customerBooking = getCustomerBase(saul);

// document refs
const orgRef = adminDb.collection(Collection.Organizations).doc(ORGANIZATION);
const userBookingRef = orgRef
  .collection(OrgSubCollection.Bookings)
  .doc(secretKey);
const attendanceDocPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Attendance}/${slotId}`;
const slotAttendanceRef = getDocumentRef(adminDb, attendanceDocPath);
const slotRef = getDocumentRef(
  adminDb,
  `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Slots}/${slotId}`
);

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

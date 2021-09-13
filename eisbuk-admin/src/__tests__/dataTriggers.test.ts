import { Collection, OrgSubCollection } from "eisbuk-shared";

import { CustomerBookings } from "@/types/temp";

import { adminDb } from "@/tests/settings";
import { ORGANIZATION } from "@/config/envInfo";

import {
  customerId,
  slotId,
  testBooking,
  attendanceWithTestCustomer,
  baseAttendance,
} from "@/__testData__/dataTriggers";

import { getDocumentRef, waitForCondition } from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deleteAll } from "@/tests/utils";

// test data
const secretKey = "test-secret-key";

// document refs
const userBookingRef = getDocumentRef(
  adminDb,
  `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Bookings}/${secretKey}`
);
const slotAttendanceRef = getDocumentRef(
  adminDb,
  `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Attendance}/${slotId}`
);

beforeEach(async () => {
  await deleteAll([OrgSubCollection.Bookings]);
});

describe("Cloud functions -> Data triggers ->,", () => {
  describe("aggregateAttendance", () => {
    testWithEmulator(
      "should create attendance entry for booking and not overwrite existing data in slot",
      async () => {
        // set up booking entry for customers booking info
        await userBookingRef.set({ customerId } as CustomerBookings);
        // set up dummy data in the same slot, not to be overwritten
        await slotAttendanceRef.set(baseAttendance);
        // add new booking trying to trigger attendance entry
        await userBookingRef
          .collection("bookedSlots")
          .doc(slotId)
          .set(testBooking);
        // check proper updates triggerd by write to bookings
        const docRes = await waitForCondition({
          documentPath: `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Attendance}/${slotId}`,
          condition: (data) => Boolean(data && data.attendances[customerId]),
        });
        expect(docRes).toEqual(attendanceWithTestCustomer);

        // test booking delete and removal from attendance trigger
        const res = await userBookingRef
          .collection("bookedSlots")
          .doc(slotId)
          .delete();
        console.log(res);
        // test customer's attendnace being removed from slot's attendnace
        const docRes2 = await waitForCondition({
          documentPath: `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Attendance}/${slotId}`,
          condition: (data) => Boolean(data && !data.attendances[customerId]),
        });
        // check that only the test customer's attendance's deleted, but not the rest of the data
        expect(docRes2).toEqual(baseAttendance);
      }
    );
  });
});

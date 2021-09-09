import { adminDb } from "@/tests/settings";

// import { Attendance, CustomerAttendance } from "@/types/temp";

import { testWithEmulator } from "@/__testUtils__/envUtils";

// const dummyCustomer = {
//   id: "customer-0",
// };

const dummyAttendance = {
  ["2021-08-05"]: {
    ["slot-0"]: {
      ["customer-0"]: {
        booked: "11:00-12:00",
        attended: null,
      },
    },
  },
};

describe("Attendance operations ->", () => {
  describe("markAttendance ->", () => {
    testWithEmulator(
      "should update attendance for provided customer",
      async () => {
        const attendanceColl = adminDb
          .collection("organizations")
          .doc("default")
          .collection("attendance");

        await attendanceColl.doc("2021-08").set(dummyAttendance);

        const test = await (await attendanceColl.doc("2021-08").get()).data();
        expect(test).toEqual(dummyAttendance);

        throw new Error("");
      }
    );
  });
});

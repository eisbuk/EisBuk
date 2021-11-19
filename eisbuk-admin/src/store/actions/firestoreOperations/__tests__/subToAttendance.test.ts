import * as firestore from "@firebase/firestore";
import { collection, query, where } from "@firebase/firestore";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { db } from "@/__testSetup__/firestoreSetup";

import { __organization__ } from "@/lib/constants";

import { LocalStore } from "@/types/store";

import { subscribe } from "../subscriptionHandlers";
import { updateLocalColl } from "../actionCreators";

import { getNewStore } from "@/store/createStore";

import { testDate, testDateLuxon } from "@/__testData__/date";
import { dummyAttendance } from "@/__testData__/dataTriggers";

const attendanceCollPath = `${Collection.Organizations}/${__organization__}/${OrgSubCollection.Attendance}`;

// we're using `onSnapshot` spy to test subscriptions to the firestore db
const onSnapshotSpy = jest.spyOn(firestore, "onSnapshot");

describe("Firestore subscription handlers", () => {
  describe("test subscribing to customers", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should subscribe to attendance entries collection for prev, curr and next month", () => {
      const attendanceCollRef = collection(db, attendanceCollPath);
      const [startDate, endDate] = [-1, 2].map((delta) =>
        testDateLuxon.plus({ months: delta }).toISODate()
      );
      const q = query(
        attendanceCollRef,
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );

      subscribe({
        coll: OrgSubCollection.Attendance,
        dispatch: jest.fn(),
        currentDate: testDateLuxon,
      });

      expect(onSnapshotSpy.mock.calls[0][0]).toEqual(q);
    });

    test("should update 'attendance' entry in the local store on snapshot update (and overwrite the existing data completely)", () => {
      const { dispatch, getState } = getNewStore();

      const initialAttendance: LocalStore["firestore"]["data"]["attendance"] = {
        ["slot-1"]: {
          date: testDate,
          attendances: {},
        },
      };
      const updatedAttendance: LocalStore["firestore"]["data"]["attendance"] = {
        ["slot-2"]: {
          date: testDate,
          attendances: dummyAttendance,
        },
        ["slot-3"]: {
          date: testDate,
          attendances: {},
        },
      };
      const update = Object.keys(updatedAttendance).reduce(
        (acc, key) => [...acc, { id: key, data: () => updatedAttendance[key] }],
        [] as any[]
      );
      dispatch(updateLocalColl(OrgSubCollection.Attendance, initialAttendance));
      onSnapshotSpy.mockImplementation((_, callback) =>
        // we're calling the update callback immediately to simulate shapshot update
        (callback as any)(update)
      );

      subscribe({
        coll: OrgSubCollection.Attendance,
        dispatch,
        currentDate: testDateLuxon,
      });

      const updatedState = getState().firestore.data.attendance;
      expect(updatedState).toEqual(updatedAttendance);
    });
  });
});

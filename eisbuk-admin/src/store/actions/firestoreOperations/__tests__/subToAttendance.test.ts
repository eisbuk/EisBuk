import * as firestore from "@firebase/firestore";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";
import { db } from "@/tests/settings";

import { LocalStore } from "@/types/store";

import { subscribe } from "../subscriptionHandlers";
import { updateLocalColl } from "../actionCreators";

import { store } from "@/store/store";

import { testDate, testDateLuxon } from "@/__testData__/date";
import { dummyAttendance } from "@/__testData__/dataTriggers";

const getFirestore = () => db;
jest.spyOn(firestore, "getFirestore").mockImplementation(getFirestore);

const attendanceCollPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Attendance}`;

// we're using `onSnapshot` spy to test subscriptions to the firestore db
const onSnapshotSpy = jest.spyOn(firestore, "onSnapshot");

describe("Firestore subscription handlers", () => {
  describe("test subscribing to customers", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should subscribe to attendance entries collection for prev, curr and next month", () => {
      const attendanceCollRef = firestore.collection(
        getFirestore(),
        attendanceCollPath
      );
      const [startDate, endDate] = [-1, 2].map((delta) =>
        testDateLuxon.plus({ months: delta }).toISODate()
      );
      const query = firestore.query(
        attendanceCollRef,
        firestore.where("date", ">=", startDate),
        firestore.where("date", "<=", endDate)
      );

      subscribe({
        coll: OrgSubCollection.Attendance,
        dispatch: store.dispatch,
        currentDate: testDateLuxon,
      });

      expect(onSnapshotSpy.mock.calls[0][0]).toEqual(query);
    });

    test("should update 'attendance' entry in the local store on snapshot update (and overwrite the existing data completely)", () => {
      const initialAttendance: LocalStore["firestore"]["data"]["attendance"] = {
        ["slot-1"]: {
          date: testDate as any /** @TODO remove this when merging */,
          attendances: {},
        },
      };
      const updatedAttendance: LocalStore["firestore"]["data"]["attendance"] = {
        ["slot-2"]: {
          date: testDate as any /** @TODO remove this when merging */,
          attendances: dummyAttendance,
        },
        ["slot-3"]: {
          date: testDate as any /** @TODO remove this when merging */,
          attendances: {},
        },
      };
      const update = Object.keys(updatedAttendance).reduce(
        (acc, key) => [...acc, { id: key, data: () => updatedAttendance[key] }],
        [] as any[]
      );
      store.dispatch(
        updateLocalColl(OrgSubCollection.Attendance, initialAttendance)
      );
      onSnapshotSpy.mockImplementation((_, callback) =>
        // we're calling the update callback immediately to simulate shapshot update
        (callback as any)(update)
      );

      subscribe({
        coll: OrgSubCollection.Attendance,
        dispatch: store.dispatch,
        currentDate: testDateLuxon,
      });

      const updatedState = store.getState().firestore.data.attendance;
      expect(updatedState).toEqual(updatedAttendance);
    });
  });
});

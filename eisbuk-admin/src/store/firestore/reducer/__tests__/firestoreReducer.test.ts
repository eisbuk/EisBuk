import { OrgSubCollection } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import firestoreReducer from "../";

import {
  updateLocalColl,
  deleteFirestoreListener,
  updateFirestoreListener,
} from "@/store/firestore/actions/actionCreators";

import { baseAttendance } from "@/__testData__/dataTriggers";

const slotId = "slot-id";
// collection we'll be using throughout the tests
const collection = OrgSubCollection.Attendance;
const consumerId = "some-consumer-id";
const unsubscribe = () => {};

/**
 * A base listener interface we're using for both observed and unobserved entries
 */
const baseListener = { unsubscribe, consumers: [consumerId] };

describe("Firestore reducer", () => {
  describe("Test Action.UpdateFirestoreListener", () => {
    test("should update a listener for a provided collection, leaving the rest intact", () => {
      // set up test state
      const initialState: LocalStore["firestore"] = {
        data: {},
        listeners: { [OrgSubCollection.Bookings]: baseListener },
      };
      // add new listener
      const updateAction = updateFirestoreListener(collection, baseListener);
      const updatedState = firestoreReducer(initialState, updateAction as any);
      expect(updatedState).toEqual({
        ...initialState,
        listeners: {
          [collection]: baseListener,
          [OrgSubCollection.Bookings]: baseListener,
        },
      });
    });
  });

  describe("Test Action.DeleteFirestoreListener", () => {
    test("should remove the listener and the firestore data for provided collection from local state", () => {
      // set up test state
      const initialState: LocalStore["firestore"] = {
        data: {
          [collection]: {
            [slotId]: baseAttendance,
          },
        },
        listeners: {
          [OrgSubCollection.Bookings]: baseListener,
          [collection]: baseListener,
        },
      };
      // delete listener
      const deleteListenerAction = deleteFirestoreListener(collection);
      const updatedState = firestoreReducer(initialState, deleteListenerAction);
      expect(updatedState).toEqual({
        data: {},
        listeners: {
          [OrgSubCollection.Bookings]: baseListener,
        },
      });
    });
  });

  describe("Test Action.UpdateLocalCollection", () => {
    /**
     * Base attendance with different date (used to test updates to the store)
     */
    const updatedAttendance = {
      [slotId]: {
        ...baseAttendance,
        date: "1550-11-11",
      },
    };

    test("should overwrite updated collection in store by default", () => {
      // set up test state
      const initialState: LocalStore["firestore"] = {
        data: {
          attendance: {
            ["dummy-slot"]: baseAttendance,
            [slotId]: baseAttendance,
          },
        },
        listeners: {},
      };
      // update attendance
      const updateAction = updateLocalColl(
        OrgSubCollection.Attendance,
        updatedAttendance
      );
      const updatedState = firestoreReducer(initialState, updateAction);
      // since the `merge` param is falsy (undefined), should overwrite the `attendance` entirely
      expect(updatedState).toEqual({
        listeners: {},
        data: { attendance: updatedAttendance },
      });
    });

    test("should update only the provided entries, without overwriting the entire state, if 'merge=true'", () => {
      // set up test state
      const initialState: LocalStore["firestore"] = {
        data: {
          attendance: {
            ["dummy-slot"]: baseAttendance,
            [slotId]: baseAttendance,
          },
        },
        listeners: {},
      };
      // update attendance
      const updateAction = updateLocalColl(
        OrgSubCollection.Attendance,
        updatedAttendance,
        true
      );
      const updatedState = firestoreReducer(initialState, updateAction);
      // since the `merge` param is true, should only update the attendance entry keyed by `slotId` (according to test data)
      expect(updatedState).toEqual({
        listeners: {},
        data: {
          attendance: { ["dummy-slot"]: baseAttendance, ...updatedAttendance },
        },
      });
    });
  });
});

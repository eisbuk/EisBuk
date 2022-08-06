import { OrgSubCollection } from "@eisbuk/shared";

import { FirestoreState } from "../../types";

import firestoreReducer from "../";

import {
  deleteFirestoreListener,
  updateFirestoreListener,
  updateLocalDocuments,
  deleteLocalDocuments,
} from "../../actions";

import { baseAttendance } from "../../__testData__/dataTriggers";
import { gus, jian, saul } from "../../__testData__/customers";

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
      const initialState: FirestoreState = {
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
      const initialState: FirestoreState = {
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

  describe("Test Action.UpdateLocalDocuments", () => {
    /**
     * Base attendance with different date (used to test updates to the store)
     */
    const updatedAttendance = {
      [slotId]: {
        ...baseAttendance,
        date: "1550-11-11",
      },
    };

    test("should update only the provided entries, without overwriting the entire state", () => {
      // set up test state
      const initialState: FirestoreState = {
        data: {
          attendance: {
            ["dummy-slot"]: baseAttendance,
            [slotId]: baseAttendance,
          },
        },
        listeners: {},
      };
      // update attendance
      const updateAction = updateLocalDocuments(
        OrgSubCollection.Attendance,
        updatedAttendance
      );
      const updatedState = firestoreReducer(initialState, updateAction);
      expect(updatedState).toEqual({
        listeners: {},
        data: {
          attendance: { ["dummy-slot"]: baseAttendance, ...updatedAttendance },
        },
      });
    });
  });

  describe("Test Action.DeleteLocalDocuments", () => {
    test("should delete the firestore document entries in local store without meddling with the rest of the collection", () => {
      // set up test state
      const initialState: FirestoreState = {
        data: {
          customers: {
            [gus.id]: gus,
            [saul.id]: saul,
            [jian.id]: jian,
          },
        },
        listeners: {},
      };
      // update attendance
      const updateAction = deleteLocalDocuments(OrgSubCollection.Customers, [
        saul.id,
        jian.id,
      ]);
      const updatedState = firestoreReducer(initialState, updateAction);
      expect(updatedState).toEqual({
        data: {
          customers: {
            [gus.id]: gus,
          },
        },
        listeners: {},
      });
    });
  });
});

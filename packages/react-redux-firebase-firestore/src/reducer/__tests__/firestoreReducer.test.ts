import { DateTime } from "luxon";

import { OrgSubCollection } from "@eisbuk/shared";

import { FirestoreState } from "../../types";

import { createFirestoreReducer } from "../";

import {
  deleteFirestoreListener,
  updateFirestoreListener,
  updateLocalDocuments,
  deleteLocalDocuments,
  markDocumentsReceived,
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
const baseListener = {
  unsubscribe,
  consumers: [consumerId],
  meta: {
    organization: "dummy-organization",
    secretKey: "12345",
    currentDate: DateTime.now(),
  },
};

describe("Firestore reducer", () => {
  describe("Test Action.UpdateFirestoreListener", () => {
    test("should update a listener for a provided collection, leaving the rest intact", () => {
      // set up test state
      const initialState: FirestoreState = {
        data: {},
        listeners: { [OrgSubCollection.Bookings]: { ...baseListener } },
      };
      // add new listener
      const updateAction = updateFirestoreListener(collection, baseListener);
      const updatedState = createFirestoreReducer()(initialState, updateAction);
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
      const updatedState = createFirestoreReducer()(
        initialState,
        deleteListenerAction
      );
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
      const updatedState = createFirestoreReducer()(initialState, updateAction);
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
      const updatedState = createFirestoreReducer()(initialState, updateAction);
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

  describe("Test Action.MarkDocumentsReceived", () => {
    test("should record received document ids on the collection's listener, once each", () => {
      const initialState: FirestoreState = {
        data: {},
        listeners: {
          [OrgSubCollection.SlotsByDay]: {
            ...baseListener,
            documents: ["2026-09", "2026-10", "2026-11"],
          },
        },
      };
      const reducer = createFirestoreReducer();

      const afterFirst = reducer(
        initialState,
        markDocumentsReceived(OrgSubCollection.SlotsByDay, ["2026-10"])
      );
      const afterSecond = reducer(
        afterFirst,
        markDocumentsReceived(OrgSubCollection.SlotsByDay, [
          "2026-10",
          "2026-09",
        ])
      );

      expect(afterSecond).toEqual({
        data: {},
        listeners: {
          [OrgSubCollection.SlotsByDay]: {
            ...baseListener,
            documents: ["2026-09", "2026-10", "2026-11"],
            receivedDocuments: ["2026-10", "2026-09"],
          },
        },
      });
      // No-op (same state) if all documents were already received
      expect(
        reducer(
          afterSecond,
          markDocumentsReceived(OrgSubCollection.SlotsByDay, ["2026-09"])
        )
      ).toBe(afterSecond);
    });

    test("should ignore received documents for a listener that doesn't exist (e.g. snapshot arriving after unsubscribing)", () => {
      const initialState: FirestoreState = { data: {}, listeners: {} };

      const updatedState = createFirestoreReducer()(
        initialState,
        markDocumentsReceived(OrgSubCollection.SlotsByDay, ["2026-10"])
      );

      expect(updatedState).toBe(initialState);
    });

    test("should keep received documents when the listener is updated (e.g. subscribing to more documents)", () => {
      const reducer = createFirestoreReducer();
      const state = reducer(
        {
          data: {},
          listeners: {
            [OrgSubCollection.SlotsByDay]: {
              ...baseListener,
              documents: ["2026-10"],
            },
          },
        },
        markDocumentsReceived(OrgSubCollection.SlotsByDay, ["2026-10"])
      );

      const updated = reducer(
        state,
        updateFirestoreListener(OrgSubCollection.SlotsByDay, {
          documents: ["2026-10", "2026-11"],
        })
      );

      expect(
        updated.listeners[OrgSubCollection.SlotsByDay]!.receivedDocuments
      ).toEqual(["2026-10"]);
    });
  });
});

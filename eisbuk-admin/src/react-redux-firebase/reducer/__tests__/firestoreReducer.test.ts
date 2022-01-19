import { OrgSubCollection } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import firestoreReducer from "../";

import {
  deleteFirestoreListener,
  updateFirestoreListener,
  updateLocalDocuments,
  deleteLocalDocuments,
} from "@/react-redux-firebase/actions";

import { baseAttendance } from "@/__testData__/dataTriggers";
import { gus, saul } from "@/__testData__/customers";

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

  describe("Test Action.UpdateLocalDocuments", () => {
    test("should update the firestore documsent entry in local store without meddling with the rest of the collection", () => {
      // set up test state
      const initialState: LocalStore["firestore"] = {
        data: {
          customers: {
            [gus.id]: gus,
            [saul.id]: saul,
          },
        },
        listeners: {},
      };
      // update attendance
      const updatedSaul = { ...saul, name: "not-saul" };
      const updateAction = updateLocalDocuments({
        collection: OrgSubCollection.Customers,
        records: [
          {
            id: saul.id,
            data: updatedSaul,
          },
        ],
      });
      const updatedState = firestoreReducer(initialState, updateAction);
      // since the `merge` param is falsy (undefined), should overwrite the `attendance` entirely
      expect(updatedState).toEqual({
        data: {
          customers: {
            [gus.id]: gus,
            [saul.id]: updatedSaul,
          },
        },
        listeners: {},
      });
    });
  });

  describe("Test Action.DeleteLocalDocuments", () => {
    test("should delete the firestore document entry in local store without meddling with the rest of the collection", () => {
      // set up test state
      const initialState: LocalStore["firestore"] = {
        data: {
          customers: {
            [gus.id]: gus,
            [saul.id]: saul,
          },
        },
        listeners: {},
      };
      // update attendance
      const updateAction = deleteLocalDocuments({
        collection: OrgSubCollection.Customers,
        ids: [saul.id],
      });
      const updatedState = firestoreReducer(initialState, updateAction);
      // since the `merge` param is falsy (undefined), should overwrite the `attendance` entirely
      console.log(updatedState);
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

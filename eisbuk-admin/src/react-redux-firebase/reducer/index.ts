import { Action } from "@/enums/store";

import {
  LocalStore,
  FirestoreAction,
  FirestoreReducerAction,
  FirestoreState,
} from "@/types/store";

const defaultState: LocalStore["firestore"] = {
  data: {},
  listeners: {},
};

export default (
  state: FirestoreState = defaultState,
  action: FirestoreReducerAction<FirestoreAction>
): FirestoreState => {
  switch (action.type) {
    case Action.UpdateFirestoreListener:
      const { collection, listener } =
        action.payload as FirestoreReducerAction<Action.UpdateFirestoreListener>["payload"];
      return {
        ...state,
        listeners: {
          ...state.listeners,
          [collection]: { ...state.listeners[collection], ...listener },
        },
      };
    case Action.DeleteFirestoreListener:
      const collectionToDelete =
        action.payload as FirestoreReducerAction<Action.DeleteFirestoreListener>["payload"];
      // remove the data from the subscribed collection from the store
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [collectionToDelete]: _coll, ...data } = state.data;
      // remove the listener for a collection from the store
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [collectionToDelete]: _listener, ...listeners } = state.listeners;
      // return state with listener for collection and the correspoding data removed
      return { data, listeners };

    case Action.UpdateLocalCollection:
      const {
        collection: collectionToUpdate1,
        data: updatedCollection1,
        merge,
      } = action.payload as FirestoreReducerAction<Action.UpdateLocalCollection>["payload"];
      return {
        data: {
          ...state.data,
          [collectionToUpdate1]: merge
            ? { ...state.data[collectionToUpdate1], ...updatedCollection1 }
            : updatedCollection1,
        },
        listeners: state.listeners,
      };

    case Action.UpdateLocalDocument:
      const {
        collection: collectionToUpdate2,
        data: updatedDocument,
        id: documentToUpdate,
      } = action.payload as FirestoreReducerAction<Action.UpdateLocalDocument>["payload"];
      return {
        data: {
          ...state.data,
          [collectionToUpdate2]: {
            ...state.data[collectionToUpdate2],
            [documentToUpdate]: updatedDocument,
          },
        },
        listeners: state.listeners,
      };

    case Action.DeleteLocalDocument:
      const { collection: collectionToUpdate3, id: documentToDelete } =
        action.payload as FirestoreReducerAction<Action.DeleteLocalDocument>["payload"];
      // copy the collection without the deleted document
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [documentToDelete]: deletedDocument, ...updatedCollection3 } =
        state.data[collectionToUpdate3] || {};
      // update state without the deleted document
      return {
        data: {
          ...state.data,
          [collectionToUpdate3]: updatedCollection3,
        },
        listeners: state.listeners,
      };
    default:
      return state;
  }
};

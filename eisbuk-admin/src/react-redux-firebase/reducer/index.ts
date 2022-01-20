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

    case Action.UpdateLocalDocuments:
      const { collection: collectionToUpdate1, data: updatedCollection1 } =
        action.payload as FirestoreReducerAction<Action.UpdateLocalDocuments>["payload"];
      return {
        data: {
          ...state.data,
          [collectionToUpdate1]: {
            ...state.data[collectionToUpdate1],
            ...updatedCollection1,
          },
        },
        listeners: state.listeners,
      };

    case Action.DeleteLocalDocuments:
      const { collection: collectionToUpdate2, ids: documentsToDelete } =
        action.payload as FirestoreReducerAction<Action.DeleteLocalDocuments>["payload"];
      // remove documents from local copy of the collection in store
      const updatedCollection2 = documentsToDelete.reduce(
        (acc, docId) => {
          // copy the collection without the deleted document
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [docId]: deletedDocument, ...otherDocuments } = acc;

          return otherDocuments;
        },
        { ...state.data[collectionToUpdate2] }
      );

      // update state without deleted documents
      return {
        data: {
          ...state.data,
          [collectionToUpdate2]: updatedCollection2,
        },
        listeners: state.listeners,
      };
    default:
      return state;
  }
};

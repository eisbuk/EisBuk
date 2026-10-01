import { Reducer } from "redux";
import { FirestoreAction } from "../enums";

import { FirestoreReducerAction, FirestoreState } from "../types";

const defaultState: FirestoreState = {
  data: {},
  listeners: {},
};

interface FirestoreReducerFactory {
  (initialState?: Partial<FirestoreState>): Reducer<
    FirestoreState,
    FirestoreReducerAction<FirestoreAction>
  >;
}

export const createFirestoreReducer: FirestoreReducerFactory =
  (initialState = {}) =>
  (
    state = { ...defaultState, ...initialState },
    action: FirestoreReducerAction<FirestoreAction>
  ): FirestoreState => {
    switch (action.type) {
      case FirestoreAction.UpdateFirestoreListener:
        const { collection, listener } =
          action.payload as FirestoreReducerAction<FirestoreAction.UpdateFirestoreListener>["payload"];
        return {
          ...state,
          listeners: {
            ...state.listeners,
            [collection]: { ...state.listeners[collection], ...listener },
          },
        };

      case FirestoreAction.DeleteFirestoreListener:
        const collectionToDelete =
          action.payload as FirestoreReducerAction<FirestoreAction.DeleteFirestoreListener>["payload"];
        // remove the data from the subscribed collection from the store
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [collectionToDelete]: _coll, ...data } = state.data;
        // remove the listener for a collection from the store
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [collectionToDelete]: _listener, ...listeners } =
          state.listeners;
        // return state with listener for collection and the correspoding data removed
        return { data, listeners };

      case FirestoreAction.UpdateLocalDocuments: {
        const { collection: collectionToUpdate, data: updatedCollection } =
          action.payload as FirestoreReducerAction<FirestoreAction.UpdateLocalDocuments>["payload"];
        return {
          data: {
            ...state.data,
            [collectionToUpdate]: {
              ...state.data[collectionToUpdate],
              ...updatedCollection,
            },
          },
          listeners: state.listeners,
        };
      }

      case FirestoreAction.DeleteLocalDocuments: {
        const { collection: collectionToUpdate, ids: documentsToDelete } =
          action.payload as FirestoreReducerAction<FirestoreAction.DeleteLocalDocuments>["payload"];
        // remove documents from local copy of the collection in store
        const updatedCollection = documentsToDelete.reduce(
          (acc, docId) => {
            // copy the collection without the deleted document
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [docId]: deletedDocument, ...otherDocuments } = acc;

            return otherDocuments;
          },
          { ...state.data[collectionToUpdate] }
        );

        // update state without deleted documents
        return {
          data: {
            ...state.data,
            [collectionToUpdate]: updatedCollection,
          },
          listeners: state.listeners,
        };
      }

      default:
        return state;
    }
  };

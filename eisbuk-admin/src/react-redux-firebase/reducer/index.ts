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
        collection: collectionToUpdate,
        data: updatedCollection,
        merge,
      } = action.payload as FirestoreReducerAction<Action.UpdateLocalCollection>["payload"];
      return {
        data: {
          ...state.data,
          [collectionToUpdate]: merge
            ? { ...state.data[collectionToUpdate], ...updatedCollection }
            : updatedCollection,
        },
        listeners: state.listeners,
      };
    default:
      return state;
  }
};

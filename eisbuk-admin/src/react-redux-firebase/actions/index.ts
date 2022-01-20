import { Action } from "@/enums/store";

import {
  CollectionSubscription,
  FirestoreListener,
  FirestoreReducerAction,
} from "@/types/store";
import { DocumentData } from "firebase/firestore";

/**
 * An action creator used to dispatch updates for given collection in local store's `firestore.data`
 * @param collection to update
 * @param data updated data entry
 * @param merge if true leaves the rest of the collection entry intact and updates only the provided data (non-recursive)
 * @returns Redux action
 */
export const updateLocalDocuments = (
  collection: string,
  data: Record<string, DocumentData>
): FirestoreReducerAction<Action.UpdateLocalDocuments> => ({
  type: Action.UpdateLocalDocuments,
  payload: { collection, data },
});

/**
 * An action creator used to delete given firestore document from corresponding collection in local store's `firestore.data`
 * @param collection to update
 * @param id document id of the document to delete
 * @returns Redux action
 */
export const deleteLocalDocuments = (
  collection: string,
  ids: string[]
): FirestoreReducerAction<Action.DeleteLocalDocuments> => ({
  type: Action.DeleteLocalDocuments,
  payload: { collection, ids },
});

/**
 * An action used to update the firestore listener for a provided collection in the Redux store:
 * - if new listener was created, stores the `unsubscribe` function and registers the first consumer
 * - if listener already exists, used to add new consumer to the `consumers` list
 * @param collection
 * @param listener
 * @returns
 */
export const updateFirestoreListener = (
  collection: CollectionSubscription,
  listener: Partial<FirestoreListener>
): FirestoreReducerAction<Action.UpdateFirestoreListener> => {
  return {
    type: Action.UpdateFirestoreListener,
    payload: { collection, listener },
  };
};

/**
 * An action used to delete the firestore listener from a Redux store,
 * as well as the local copy of the provided collection's data
 * @param collection
 * @returns
 */
export const deleteFirestoreListener = (
  collection: CollectionSubscription
): FirestoreReducerAction<Action.DeleteFirestoreListener> => ({
  type: Action.DeleteFirestoreListener,
  payload: collection,
});

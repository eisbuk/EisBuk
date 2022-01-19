import { BookingSubCollection } from "eisbuk-shared";

import { Action } from "@/enums/store";

import {
  CollectionSubscription,
  FirestoreListener,
  FirestoreReducerAction,
  UpdateFirestoreDataPayload,
} from "@/types/store";

interface UpdateFirestoreData<
  A extends Action.UpdateLocalDocuments | Action.DeleteLocalDocuments
> {
  <C extends CollectionSubscription | BookingSubCollection.BookedSlots>(
    payload: UpdateFirestoreDataPayload<C>[A]
  ): {
    type: A;
    payload: UpdateFirestoreDataPayload<C>[A];
  };
}

/**
 * An action creator used to dispatch updates for the given set of documents in a collection in local store's `firestore.data`
 * @param collection of the document to update
 * @param id document `id` of corresponding firestore document, `key` for local store entry
 * @param data updated data entry
 * @returns Redux action
 */
export const updateLocalDocuments: UpdateFirestoreData<Action.UpdateLocalDocuments> =
  ({ collection, records }) => ({
    type: Action.UpdateLocalDocuments,
    payload: { collection, records },
  });

/**
 * An action creator used to delete given set of firestore documents from corresponding collection in local store's `firestore.data`
 * @param collection to update
 * @param id document id of the document to delete
 * @returns Redux action
 */
export const deleteLocalDocuments: UpdateFirestoreData<Action.DeleteLocalDocuments> =
  ({ collection, ids }) => ({
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

import { BookingSubCollection } from "eisbuk-shared";

import { Action } from "@/enums/store";

import {
  CollectionSubscription,
  FirestoreListener,
  FirestoreReducerAction,
  UpdateFirestoreDataPayload,
} from "@/types/store";

interface UpdateFirestoreData<
  A extends
    | Action.UpdateLocalCollection
    | Action.UpdateLocalDocument
    | Action.DeleteLocalDocument
> {
  <C extends CollectionSubscription | BookingSubCollection.BookedSlots>(
    payload: UpdateFirestoreDataPayload<C>[A]
  ): {
    type: A;
    payload: UpdateFirestoreDataPayload<C>[A];
  };
}

/**
 * An action creator used to dispatch updates for given collection in local store's `firestore.data`
 * @param collection to update
 * @param data updated data entry
 * @param merge if true leaves the rest of the collection entry intact and updates only the provided data (non-recursive)
 * @returns Redux action
 */
export const updateLocalColl: UpdateFirestoreData<Action.UpdateLocalCollection> =
  ({ collection, data, merge }) => ({
    type: Action.UpdateLocalCollection,
    payload: { collection, data, merge },
  });

/**
 * An action creator used to dispatch updates for given document in a collection in local store's `firestore.data`
 * @param collection of the document to update
 * @param id document `id` of corresponding firestore document, `key` for local store entry
 * @param data updated data entry
 * @returns Redux action
 */
export const updateLocalDocument: UpdateFirestoreData<Action.UpdateLocalDocument> =
  ({ collection, id, data }) => ({
    type: Action.UpdateLocalDocument,
    payload: { collection, data, id },
  });

/**
 * An action creator used to delete given firestore document from corresponding collection in local store's `firestore.data`
 * @param collection to update
 * @param id document id of the document to delete
 * @returns Redux action
 */
export const deleteLocalDocument: UpdateFirestoreData<Action.DeleteLocalDocument> =
  ({ collection, id }) => ({
    type: Action.DeleteLocalDocument,
    payload: { collection, id },
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

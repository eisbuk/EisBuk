import { BookingSubCollection } from "eisbuk-shared";

import { Action } from "@/enums/store";

import {
  CollectionSubscription,
  FirestoreData,
  FirestoreListener,
  UpdateFirestoreDataPayload,
} from "@/types/store";

interface UpdateLocalColl {
  <C extends CollectionSubscription | BookingSubCollection.BookedSlots>(
    collection: C,
    data: FirestoreData[C],
    merge?: boolean
  ): {
    type: Action.UpdateLocalCollection;
    payload: UpdateFirestoreDataPayload<C>;
  };
}

/**
 * An action creator used to dispatch updates for given collection in local store `firestore.data`
 * @param collection to update
 * @param data updated data entry
 * @param merge if true leaves the rest of the collection entry intact and updates only the provided data (non-recursive)
 * @returns Redux action
 */
export const updateLocalColl: UpdateLocalColl = (collection, data, merge) => ({
  type: Action.UpdateLocalCollection,
  payload: { collection, data, merge },
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
  listener: FirestoreListener
): {
  type: Action.UpdateFirestoreListener;
  payload: Partial<Record<CollectionSubscription, FirestoreListener>>;
} => ({
  type: Action.UpdateFirestoreListener,
  payload: { [collection]: listener },
});

/**
 * An action used to delete the firestore listener from a Redux store,
 * as well as the local copy of the provided collection's data
 * @param collection
 * @returns
 */
export const deleteFirestoreListener = (
  collection: CollectionSubscription
): {
  type: Action.DeleteFirestoreListener;
  payload: CollectionSubscription;
} => ({
  type: Action.DeleteFirestoreListener,
  payload: collection,
});

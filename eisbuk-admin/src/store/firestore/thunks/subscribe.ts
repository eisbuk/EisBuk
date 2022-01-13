import {
  getFirestore,
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentData,
  Unsubscribe,
  doc,
  query,
  where,
} from "@firebase/firestore";

import {
  CollectionSubscription,
  FirestoreListener,
  FirestoreThunk,
} from "@/types/store";

import {
  updateFirestoreListener,
  updateLocalColl,
} from "@/store/firestore/actions";

import { getFirestoreListeners } from "@/store/firestore/selectors";

export type FirestoreListenerConstraint = Pick<FirestoreListener, "range"> &
  Pick<FirestoreListener, "documents">;

export interface SubscriptionParams {
  collPath: string;
  storeAs?: string;
  constraint: FirestoreListenerConstraint | null;
}

interface SubscribeFunction {
  (params: SubscriptionParams): FirestoreThunk;
}

export const updateSubscription: SubscribeFunction =
  ({ collPath, storeAs, constraint }) =>
  async (dispatch, getState) => {
    // a fallback local store entry name in case `storeAs` is not defined
    const collName: CollectionSubscription = (storeAs ||
      collPath.split("/").pop()) as CollectionSubscription;

    if (!collName) {
      throw new Error("Invalid collection path");
    }

    const collRef = collection(getFirestore(), collPath);

    const listener: FirestoreListener =
      getFirestoreListeners(getState())[collName as CollectionSubscription] ||
      ({} as FirestoreListener);

    // subscribe to all
    if (constraint === null) {
      // if already subscribed to a constrained collection,
      // unsubscribe
      if (listener.unsubscribe) {
        listener.unsubscribe();
      }
      listener.unsubscribe = onSnapshot(
        collRef,
        createCollSnapshotHandler(dispatch, collName)
      );
    }

    const { range, documents } = constraint || {};

    // subscribe to range
    if (range) {
      const [rangeProperty, rangeStart, rangeEnd] = range;
      let unsubscribe: Unsubscribe;
      let oldUnsubscribe: Unsubscribe;

      const rangeInStore = listener.range;

      // if some range for collection already exists in store
      // trim new range to reduce redundancy
      if (rangeInStore && rangeProperty === rangeInStore[0]) {
        const [, storeRangeStart, storeRangeEnd] = rangeInStore;
        switch (true) {
          // extend range in both directions: should happed rarely (or never) in production
          case rangeStart < storeRangeStart && rangeEnd > storeRangeEnd:
            // unsubscribe from old range
            listener.unsubscribe();
            listener.unsubscribe = onSnapshot(
              query(
                collRef,
                where(rangeProperty, ">=", storeRangeEnd),
                where(rangeProperty, "<=", rangeEnd)
              ),
              createCollSnapshotHandler(dispatch, collName)
            );
            // update listener with the new range
            listener.range = [rangeProperty, rangeStart, rangeEnd];
            break;

          // add range from right side
          case rangeStart <= storeRangeEnd && rangeEnd > storeRangeEnd:
            unsubscribe = onSnapshot(
              query(
                collRef,
                where(rangeProperty, ">", storeRangeEnd),
                where(rangeProperty, "<=", rangeEnd)
              ),
              createCollSnapshotHandler(dispatch, collName)
            );
            oldUnsubscribe = listener.unsubscribe;
            listener.unsubscribe = () => {
              oldUnsubscribe();
              unsubscribe();
            };
            listener.range = [rangeProperty, storeRangeStart, rangeEnd];
            break;

          // add range from left side
          case rangeStart < storeRangeStart && rangeEnd >= storeRangeStart:
            unsubscribe = onSnapshot(
              query(
                collRef,
                where(rangeProperty, ">=", rangeStart),
                where(rangeProperty, "<", storeRangeStart)
              ),
              createCollSnapshotHandler(dispatch, collName)
            );
            oldUnsubscribe = listener.unsubscribe;
            listener.unsubscribe = () => {
              oldUnsubscribe();
              unsubscribe();
            };
            listener.range = [rangeProperty, rangeStart, storeRangeEnd];
            break;

          // if two ranges have no overlap (in which case new range takes presedance)
          // this shouldn't happen in production but is here as an edge case
          default:
            // unsubscribe from old range
            listener.unsubscribe();
            listener.unsubscribe = onSnapshot(
              query(
                collRef,
                where(rangeProperty, ">=", rangeStart),
                where(rangeProperty, "<=", rangeEnd)
              ),
              createCollSnapshotHandler(dispatch, collName)
            );
            listener.range = range;
        }
      } else {
        // no range exists in store, apply range as is
        listener.unsubscribe = onSnapshot(
          query(
            collRef,
            where(rangeProperty, ">=", rangeStart),
            where(rangeProperty, "<=", rangeEnd)
          ),
          createCollSnapshotHandler(dispatch, collName)
        );
        listener.range = range;
      }
    }

    // subscribe to docs
    if (documents) {
      const unsubscribeFunctions: Unsubscribe[] = [];

      // if some documents for collection already exist in store
      // trim new documents to only subscribe to diff
      const subscribedDocs = listener.documents || [];
      const trimmedDocs = documents.filter(
        (docId) => !subscribedDocs.includes(docId)
      );

      trimmedDocs.forEach((docId) => {
        const docRef = doc(collRef, docId);
        const unsubscribe = onSnapshot(
          docRef,
          createDocSnapshotHandler(dispatch, collName)
        );
        unsubscribeFunctions.push(unsubscribe);
      });

      // return one unsubscribe function composed of all
      // unsubscribe functions returned from each `onSnapshot` call
      // and "old" `listener.unsubscribe` function from store (if one such exists)
      const oldUnsubscribe = listener.unsubscribe || (() => {});
      listener.unsubscribe = unsubscribeFunctions.reduce(
        (acc, curr) => () => {
          acc();
          curr();
        },
        oldUnsubscribe
      );
      listener.documents = [...trimmedDocs, ...subscribedDocs].sort((a, b) =>
        a > b ? 1 : -1
      );
    }

    // update listener
    dispatch(updateFirestoreListener(collName, listener));
  };

interface OnSnapshotHandlerHOF<T extends "doc" | "coll"> {
  (dispatch: Parameters<FirestoreThunk>[0], storeAs: string): (
    collSnapshot: T extends "doc"
      ? DocumentSnapshot<DocumentData>
      : QuerySnapshot<DocumentData>
  ) => void;
}

/**
 * A HOF used to create `onSnapshot`'s `onNext` callback function for a collection:
 * a function in charge of updating local store on each subscribed firestore update.
 *
 * The return function iterates through all recieved firestore docs and saves each doc's
 * data in local store's `firestore.data.[storeAs]` collection, keyed by doc's id
 * @param dispatch `store.dispatch`
 * @param storeAs name of collection in local store's `firestore.data`
 */
export const createCollSnapshotHandler: OnSnapshotHandlerHOF<"coll"> =
  (dispatch, storeAs) => (collSnapshot) => {
    let updatedData = {};
    collSnapshot.forEach((doc) => {
      const docId = doc.id;
      const entry = doc.data();
      updatedData = { ...updatedData, [docId]: entry };
    });

    dispatch(
      updateLocalColl(storeAs as CollectionSubscription, updatedData, true)
    );
  };

/**
 * A HOF used to create `onSnapshot`'s `onNext` callback function for single document:
 * a function in charge of updating local store on each subscribed firestore update.
 *
 * The return function saves the doc's data in local store's
 * `firestore.data.[storeAs]` collection, keyed by doc's id
 * @param dispatch `store.dispatch`
 * @param storeAs name of collection in local store's `firestore.data`
 */
export const createDocSnapshotHandler: OnSnapshotHandlerHOF<"doc"> =
  (dispatch, storeAs) => (docSnapshot) => {
    const docData = docSnapshot.data();

    dispatch(
      updateLocalColl(
        storeAs as CollectionSubscription,
        { [docSnapshot.id]: docData } as any,
        true
      )
    );
  };

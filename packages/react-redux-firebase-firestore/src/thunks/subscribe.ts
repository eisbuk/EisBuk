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
} from "../types";

import {
  updateLocalDocuments,
  deleteLocalDocuments,
  updateFirestoreListener,
} from "../actions";

import { getFirestoreListeners } from "../selectors";

import { createGetDocsInStore } from "./utils";

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

/**
 * A handler used to create or update firestore subscription.
 * - if creating a new listener, subscribes to firestore using `onShapshot` with respect to
 *   `constraint` and updates the listener entry in local store with `unsubscribe` handler returned from `onSnapshot`
 *   as well as `constraint` (if any)
 * - if updating an existing listener, checks the listener entry in local store and creates and subscribes to the difference
 *   from existing subscription (extended `range`, or additional `documents`). After subscription, updates the listener
 *   listener entry in local store with `unsubscribe` function composed of existing `listener.unsubscribe` function and the
 *   new `unsubscribe` function returned from new subscription's `onSnapshot`
 *
 * @param {string} params.collPath a firestore path to a given collection (i.e. `"organizations/{organziation}/attendance"`)
 * @param {string} params.storeAs a key for local store `firestore.data` and `firestore.listeners` entry for a collection (most commonly a collection name)
 * @param constraint `null` (in case of subscribing to an entire collection) or an object containing `range` or `documents` constraint for firestore query
 * @returns firestore thunk
 */
export const updateSubscription: SubscribeFunction =
  ({ collPath, storeAs, constraint }: SubscriptionParams): FirestoreThunk =>
  async (dispatch, getState) => {
    // a fallback local store entry name in case `storeAs` is not defined
    const collName: CollectionSubscription = (storeAs ||
      collPath.split("/").pop()) as CollectionSubscription;

    if (!collName) {
      throw new Error("Invalid collection path");
    }

    const collRef = collection(getFirestore(), collPath);

    const listener =
      getFirestoreListeners(getState())[collName as CollectionSubscription] ||
      ({} as FirestoreListener);

    // #region nullConstraintSubscription
    if (constraint === null) {
      // if already subscribed to a constrained collection,
      // unsubscribe
      if (listener.unsubscribe) {
        listener.unsubscribe();
      }
      listener.unsubscribe = onSnapshot(
        collRef,
        createCollSnapshotHandler(
          dispatch,
          collName,
          createGetDocsInStore(collName, getState, null)
        )
      );
    }
    // #endregion nullConstraintSubscription

    const { range, documents } = constraint || {};

    // #region rangeConstraintSubscription
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
          // exit early if ranges are the same
          case rangeStart >= storeRangeStart && rangeEnd <= storeRangeEnd:
            return;

          // extend range in both directions: should happed rarely (or never) in production
          case rangeStart < storeRangeStart && rangeEnd > storeRangeEnd:
            // unsubscribe from old range
            listener.unsubscribe();
            listener.unsubscribe = onSnapshot(
              query(
                collRef,
                where(rangeProperty, ">=", rangeStart),
                where(rangeProperty, "<=", rangeEnd)
              ),
              createCollSnapshotHandler(
                dispatch,
                collName,
                createGetDocsInStore(collName, getState, { range })
              )
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
              createCollSnapshotHandler(
                dispatch,
                collName,
                createGetDocsInStore(
                  collName,
                  getState,
                  {
                    range: [rangeProperty, storeRangeEnd, rangeEnd],
                  },
                  [false, true]
                )
              )
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
              createCollSnapshotHandler(
                dispatch,
                collName,
                createGetDocsInStore(
                  collName,
                  getState,
                  {
                    range: [rangeProperty, rangeStart, storeRangeStart],
                  },
                  [true, false]
                )
              )
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
              createCollSnapshotHandler(
                dispatch,
                collName,
                createGetDocsInStore(collName, getState, {
                  range: [rangeProperty, rangeStart, rangeEnd],
                })
              )
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
          createCollSnapshotHandler(
            dispatch,
            collName,
            createGetDocsInStore(collName, getState, {
              range: [rangeProperty, rangeStart, rangeEnd],
            })
          )
        );
        listener.range = range;
      }
    }
    // #endregion rangeConstraintSubscription

    // #region documentsConstraintSubscription
    if (documents) {
      const unsubscribeFunctions: Unsubscribe[] = [];

      // if some documents for collection already exist in store
      // trim new documents to only subscribe to diff
      const subscribedDocs = listener.documents || [];
      const trimmedDocs = documents.filter(
        (docId) => !subscribedDocs.includes(docId)
      );

      // exit early if there are no new docs to subscribe to
      if (!trimmedDocs.length) return;

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
    // #endregion documentsConstraintSubscription

    // update listener
    dispatch(updateFirestoreListener(collName, listener));
  };

interface OnSnapshotHandlerHOF<T extends "doc" | "coll"> {
  (
    dispatch: Parameters<FirestoreThunk>[0],
    storeAs: string,
    getDocsInStore?: () => string[]
  ): (
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
 * @param getDocsInStore a function with curried range and `store.getState` used to get existing documents in store for appropriate constraint
 */
export const createCollSnapshotHandler: OnSnapshotHandlerHOF<"coll"> =
  (dispatch, storeAs, getDocsInStore) => (collSnapshot) => {
    const updatedDocuments: Record<string, DocumentData> = {};
    // we start docs to delete as all of the docs in state (belonging to this constraint)
    // and remove each doc id as it's updated (leaving us with deleted documents)
    let docsToDelete = getDocsInStore ? getDocsInStore() : [];

    collSnapshot.forEach((doc) => {
      const docId = doc.id;
      const docData = doc.data();

      updatedDocuments[docId] = docData;
      // remove updated doc's id from docs to delete
      docsToDelete = docsToDelete.filter((id) => id !== docId);
    });

    dispatch(updateLocalDocuments(storeAs, updatedDocuments));

    // delete all documents which weren't in the updated collection (if any)
    if (docsToDelete.length) {
      dispatch(deleteLocalDocuments(storeAs, docsToDelete));
    }
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
    const docId = docSnapshot.id;
    const docData = docSnapshot.data();

    if (docData) {
      dispatch(updateLocalDocuments(storeAs, { [docId]: docData }));
    } else {
      // if `docData` is undefined the document has been deleted from firestore
      dispatch(deleteLocalDocuments(storeAs, [docId]));
    }
  };

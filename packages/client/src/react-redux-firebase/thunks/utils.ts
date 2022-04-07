import { CollectionSubscription, FirestoreThunk } from "@/types/store";
import { FirestoreListenerConstraint } from "./subscribe";

/**
 * A HOF used to return a getter function for doc ids of docs in store belonging
 * to a provided constraint.
 * @param collection name of the collection
 * @param getState `store.getState` reference
 * @param constraint docs, range or `null`
 * @param rangeInclusivity a two member boolean tuple used to toggle range inclusivity:
 * ```
 * [true, false] // gets docs which are greater or equal to rangeStart and exclusively lesser than end
 * [false, true] // gets docs which are strictly greater than rangeStart and lesser or equal than end
 * [true, true] // default..gets the entire range including the edges
 * ```
 * @returns a getter function curried with `store.getState` and provided constraint, returning an
 * array of document ids
 */
export const createGetDocsInStore =
  (
    collection: CollectionSubscription,
    getState: Parameters<FirestoreThunk>[1],
    constraint: FirestoreListenerConstraint | null,
    rangeInclusivity = [true, true]
  ): (() => string[]) =>
  () => {
    // get all docs for a collection from store (if collection exists)
    const collectionInStore = getState().firestore.data[collection] || {};
    const allDocIds = Object.keys(collectionInStore);

    if (constraint?.range) {
      const [startInclusive, endInclusive] = rangeInclusivity;

      // if range return docs in store (if any) belonging to the provided range
      const [rangeParam, start, end] = constraint.range;
      return allDocIds.filter((docId) => {
        const param = collectionInStore[docId][rangeParam];
        return (
          param &&
          (startInclusive ? param >= start : param > start) &&
          (endInclusive ? param <= end : param < end)
        );
      });
    }

    return Object.keys(collectionInStore);
  };

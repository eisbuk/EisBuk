import { adminDb } from "./adminDb";
import {
  DocumentReference,
  DocumentData,
  WriteResult,
} from "@google-cloud/firestore";

import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";

import { FirestoreDataUpdate } from "../types";

/**
 * A handler for firestore data updates. Accepts the entire update data
 * structure and handles distributing and awaiting updates for each collection
 * and it's subcollections, if such exist
 * @param organization name of current test organziation
 * @param data entire firestore updates structure:
 * including (optional) updates to "attendance", "bookings", "customers", "slots"
 */
const updateFirestoreData = async (
  organization: string,
  data: FirestoreDataUpdate
): Promise<void> => {
  const orgRef = adminDb.collection(Collection.Organizations).doc(organization);
  const collectionsToUpdate = Object.keys(data);

  await Promise.all(
    collectionsToUpdate.reduce(
      (acc, collName) => [
        ...acc,
        ...queueCollectionUpdates(orgRef, collName, data[collName]),
      ],
      []
    )
  );
};

export default updateFirestoreData;

/**
 * A helper function used to buffer all document updates for a provided collection
 * and it's subcollections (if any). The returned array (of update promises) can then be
 * awaited using Promise.all
 * @param startingPoint at top level this is a reference to an organization document, but
 * can be invoked (recursively) with some other document during function execution, when updating subcollections
 * @param collName name of collection to update (used to create a reference by chaining on `startingPoint`)
 * @param documents `{[docId: string]: DocumentData}` object of documents to update
 * @returns array of promises used to await updates
 */
const queueCollectionUpdates = (
  startingPoint: DocumentReference<DocumentData>,
  collName: string,
  documents: Record<string, DocumentData>
): Promise<WriteResult>[] => {
  const collRef = startingPoint.collection(collName);

  const docIds = Object.keys(documents || {});

  return docIds.reduce((acc, docId) => {
    const docRef = collRef.doc(docId);
    // in case of collection being `bookings` we might expect `bookedSlots` subcollection
    //
    // if exists, we want to remove it from document updates and update subsquently as it's own collection
    // on current document
    //
    // if it doesn't exist, it will simply be undefined
    const { bookedSlots, ...docData } = documents[docId];

    const docUpdate = docRef.set(docData);

    // return an array composed of all `docUpdate` promises accumulated so far (and the current `docUpdate`)
    return [
      ...acc,
      docUpdate,
      // if collection `bookings` and `bookedSlots` data exists
      // enqueue `bookedSlots` updates to the returned updates array
      ...(collName === OrgSubCollection.Bookings && Boolean(bookedSlots)
        ? queueCollectionUpdates(
            docRef,
            BookingSubCollection.BookedSlots,
            bookedSlots
          )
        : []),
    ];
  }, [] as Promise<WriteResult>[]);
};

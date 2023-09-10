import {
  fields,
  match,
  TypeNames,
  variantModule,
  VariantOf,
  isType,
} from "variant";
import type {
  Firestore as ServerFirestore,
  CollectionReference as ServerCollectionReference,
  DocumentReference as ServerDocumentReference,
} from "@google-cloud/firestore";
import {
  type Firestore as ClientFirestore,
  type CollectionReference as ClientCollectionReference,
  type DocumentReference as ClientDocumentReference,
  type SetOptions,
  doc as clientDoc,
  collection as clientCollection,
  setDoc as clientSetDoc,
  addDoc as clientAddDoc,
  getDoc as clientGetDoc,
  getDocs as clientGetDocs,
  deleteDoc as deleteDocClient,
  writeBatch as writeBatchClient,
  DocumentData,
} from "@firebase/firestore";

export enum FirestoreEnv {
  Client = "client",
  Server = "server",
}

// #region client/server variants
/**
 * A discriminated union of different Firestore db instances:
 * - Firebase v9 (used by client)
 * - Google cloud/firestore (used by server functions)
 * - Firebase compat (used by firestore-rules-unit-testing)
 */
export const FirestoreVariant = variantModule({
  [FirestoreEnv.Client]: fields<{ instance: ClientFirestore }>(),
  [FirestoreEnv.Server]: fields<{ instance: ServerFirestore }>(),
});
export type FirestoreVariant<
  K extends TypeNames<typeof FirestoreVariant> = undefined
> = VariantOf<typeof FirestoreVariant, K>;

/**
 * A discriminated union of different Firestore DocumentReference instances:
 * - Firebase v9 (used by client)
 * - Google cloud/firestore (used by server functions)
 * - Firebase compat (used by firestore-rules-unit-testing)
 */
export const FirestoreDocVariant = variantModule({
  [FirestoreEnv.Client]: fields<{ instance: ClientDocumentReference }>(),
  [FirestoreEnv.Server]: fields<{ instance: ServerDocumentReference }>(),
});
export type FirestoreDocVariant<
  K extends TypeNames<typeof FirestoreDocVariant> = undefined
> = VariantOf<typeof FirestoreDocVariant, K>;

/**
 * A discriminated union of different Firestore CollectionReference instances:
 * - Firebase v9 (used by client)
 * - Google cloud/firestore (used by server functions)
 * - Firebase compat (used by firestore-rules-unit-testing)
 */
export const FirestoreCollectionVariant = variantModule({
  [FirestoreEnv.Client]: fields<{ instance: ClientCollectionReference }>(),
  [FirestoreEnv.Server]: fields<{ instance: ServerCollectionReference }>(),
});
export type FirestoreCollectionVariant<
  K extends TypeNames<typeof FirestoreCollectionVariant> = undefined
> = VariantOf<typeof FirestoreCollectionVariant, K>;
// #endregion client/server variants

// #region functions
/**
 * Implementation of firestore `doc` function that works on all Firestore variants.
 * For each variant applies the correct doc function/method and returns a corresponding variant
 * of the DocumentReference (e.g. for client SDK, it returns a client SDK DocumentReference, and so on)
 * @param node starting node - either firestore db instance, or collection instance (in form of a variant, used to match correct implementation)
 * @param pathSegments
 * @returns
 */
export const doc = (
  node: FirestoreVariant | FirestoreCollectionVariant,
  ...pathSegments: string[]
): FirestoreDocVariant => {
  const docPath = pathSegments.join("/");

  return match(node, {
    [FirestoreEnv.Client]: ({ instance }) =>
      FirestoreDocVariant.client({
        // Even though 'doc' (aliased as 'clientDoc' here) works on both firestore and collection references,
        // it doesn't work well on unions because of slightly different type overloads, hence the typecast.
        instance: docPath.length
          ? clientDoc(
              instance as ClientCollectionReference,
              docPath.length ? docPath : undefined
            )
          : clientDoc(instance as ClientCollectionReference),
      }),
    [FirestoreEnv.Server]: ({ instance }) =>
      FirestoreDocVariant.server({
        instance: docPath.length
          ? instance.doc(docPath)
          : (instance as ServerCollectionReference).doc(),
      }),
  });
};

/**
 * Implementation of firestore `collection` function that works on all Firestore variants.
 * For each variant applies the correct collection function/method and returns a corresponding variant
 * of the CollectionReference (e.g. for client SDK, it returns a client SDK DocumentReference, and so on)
 * @param node starting node - either firestore db instance, or a document node instance (in form of a variant, used to match correct implementation)
 * @param pathSegments
 * @returns
 */
export const collection = (
  node: FirestoreVariant | FirestoreDocVariant,
  ...pathSegments: string[]
): FirestoreCollectionVariant =>
  match(node, {
    [FirestoreEnv.Client]: ({ instance }) =>
      FirestoreCollectionVariant.client({
        // Even though 'collection' (aliased as 'clientCollection' here) works on both firestore and document instanceerences,
        // it doesn't work well on unions because of slightly different type overloads, hence the typecast.
        instance: clientCollection(
          instance as ClientFirestore,
          pathSegments.join("/")
        ),
      }),
    [FirestoreEnv.Server]: ({ instance }) =>
      FirestoreCollectionVariant.server({
        instance: instance.collection(pathSegments.join("/")),
      }),
  });

export const addDoc = async (
  collection: FirestoreCollectionVariant,
  data: DocumentData
) => {
  const res = await match(collection, {
    [FirestoreEnv.Client]: ({ instance }) => clientAddDoc(instance, data),
    [FirestoreEnv.Server]: ({ instance }) => instance.add(data),
  });
  return res;
};

/**
 * Implementation of firestore `setDoc` function that works on all Firestore variants.
 * For each variant applies the correct `setDoc`/`set` function/method to update the given doc.
 * @param doc document to update in form of a FirestoreDocVariant (used to match with correct behaviour)
 * @param data
 * @param options
 * @returns
 */
export const setDoc = async (
  doc: FirestoreDocVariant,
  data: DocumentData,
  options: SetOptions = {}
) => {
  const res = await match(doc, {
    [FirestoreEnv.Client]: ({ instance }) =>
      clientSetDoc(instance, data, options),
    [FirestoreEnv.Server]: ({ instance }) => instance.set(data, options),
  });
  return res;
};

/**
 * Implementation of firestore `getDoc` function that works on all Firestore variants.
 * For each variant applies the correct `getDoc` `doc.get` function/method to return the DocumentSnapshot (of the same variant).
 * @param doc document reference variant
 * @returns
 */
export const getDoc = async (doc: FirestoreDocVariant) => {
  const res = await match(doc, {
    [FirestoreEnv.Client]: ({ instance }) => clientGetDoc(instance),
    [FirestoreEnv.Server]: ({ instance }) => instance.get(),
  });
  return res;
};

/**
 * Implementation of firestore `deleteDoc` function that works on all Firestore variants.
 * For each variant applies the correct `deleteDoc`/`doc.delete` function/method to delete the given doc.
 * @param doc document to delete in form of a FirestoreDocVariant (used to match with correct behaviour)
 * @returns
 */
export const deleteDoc = async (doc: FirestoreDocVariant) => {
  const res = await match(doc, {
    [FirestoreEnv.Client]: ({ instance }) => deleteDocClient(instance),
    [FirestoreEnv.Server]: ({ instance }) => instance.delete(),
  });
  return res;
};

/**
 * Implementation of firestore `getDocs` function that works on all Firestore variants.
 * For each variant applies the correct `getDocs`/`collection.get` function/method to return the QuerySnapshot (of the same variant).
 * @param collection collection reference in form of a FirestoreCollectionVariant (used to match with correct behaviour)
 * @returns
 */
export const getDocs = async (collection: FirestoreCollectionVariant) => {
  const res = await match(collection, {
    [FirestoreEnv.Client]: ({ instance }) => clientGetDocs(instance),
    [FirestoreEnv.Server]: ({ instance }) => instance.get(),
  });
  return res;
};

// eslint-disable-next-line require-jsdoc
class BatchMismatch extends Error {
  // eslint-disable-next-line require-jsdoc
  constructor(batchType: FirestoreEnv, docType: FirestoreEnv) {
    super(
      `Write batch/document variant mismatch: batch type: ${batchType}, doc type: ${docType}`
    );
    return this;
  }
}

export const writeBatch = (db: FirestoreVariant) =>
  match(db, {
    [FirestoreEnv.Client]: ({ instance }) => {
      const batch = writeBatchClient(instance);
      return {
        ...batch,
        set: (doc: FirestoreDocVariant, data: DocumentData) => {
          if (!isType(doc, FirestoreDocVariant.client)) {
            throw new BatchMismatch(FirestoreEnv.Client, doc.type);
          }
          return batch.set(doc.instance, data);
        },
        commit: batch.commit.bind(batch),
      };
    },
    [FirestoreEnv.Server]: ({ instance }) => {
      const batch = instance.batch();
      return {
        ...batch,
        set: (doc: FirestoreDocVariant, data: DocumentData) => {
          if (!isType(doc, FirestoreDocVariant.server)) {
            throw new BatchMismatch(FirestoreEnv.Server, doc.type);
          }
          return batch.set(doc.instance, data);
        },
        commit: batch.commit.bind(batch),
      };
    },
  });

// #endregion functions

import { fields, match, TypeNames, variantModule, VariantOf } from "variant";
import type {
  Firestore as ServerFirestore,
  CollectionReference as ServerCollectioninstanceerence,
  DocumentReference as ServerDocumentinstanceerence,
} from "@google-cloud/firestore";
import {
  type Firestore as ClientFirestore,
  type CollectionReference as ClientCollectioninstanceerence,
  type DocumentReference as ClientDocumentinstanceerence,
  type SetOptions,
  doc as clientDoc,
  collection as clientCollection,
  setDoc as clientSetDoc,
  getDoc as clientGetDoc,
  getDocs as clientGetDocs,
  deleteDoc as deleteDocClient,
} from "@firebase/firestore";
import firebase from "firebase/compat/app";

export enum FirestoreEnv {
  Client = "client",
  Server = "server",
  Compat = "compat",
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
  [FirestoreEnv.Compat]: fields<{ instance: firebase.firestore.Firestore }>(),
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
  [FirestoreEnv.Client]: fields<{ instance: ClientDocumentinstanceerence }>(),
  [FirestoreEnv.Server]: fields<{ instance: ServerDocumentinstanceerence }>(),
  [FirestoreEnv.Compat]: fields<{
    instance: firebase.firestore.DocumentReference;
  }>(),
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
  [FirestoreEnv.Client]: fields<{ instance: ClientCollectioninstanceerence }>(),
  [FirestoreEnv.Server]: fields<{ instance: ServerCollectioninstanceerence }>(),
  [FirestoreEnv.Compat]: fields<{
    instance: firebase.firestore.CollectionReference;
  }>(),
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
): FirestoreDocVariant =>
  match(node, {
    [FirestoreEnv.Client]: ({ instance }) =>
      FirestoreDocVariant.client({
        // Even though 'doc' (aliased as 'clientDoc' here) works on both firestore and collection instanceerences,
        // it doesn't work well on unions because of slightly different type overloads, hence the typecast.
        instance: clientDoc(
          instance as ClientFirestore,
          pathSegments.join("/")
        ),
      }),
    [FirestoreEnv.Server]: ({ instance }) =>
      FirestoreDocVariant.server({
        instance: instance.doc(pathSegments.join("/")),
      }),
    [FirestoreEnv.Compat]: ({ instance }) =>
      FirestoreDocVariant.compat({
        instance: instance.doc(pathSegments.join("/")),
      }),
  });

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
    [FirestoreEnv.Compat]: ({ instance }) =>
      FirestoreCollectionVariant.compat({
        instance: instance.collection(pathSegments.join("/")),
      }),
  });

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
  data: Parameters<typeof clientSetDoc>[1],
  options: SetOptions = {}
) => {
  const res = await match(doc, {
    [FirestoreEnv.Client]: ({ instance }) =>
      clientSetDoc(instance, data, options),
    [FirestoreEnv.Server]: ({ instance }) => instance.set(data),
    [FirestoreEnv.Compat]: ({ instance }) => instance.set(data, options),
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
    [FirestoreEnv.Compat]: ({ instance }) => instance.get(),
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
    [FirestoreEnv.Compat]: ({ instance }) => instance.delete(),
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
    [FirestoreEnv.Compat]: ({ instance }) => instance.get(),
  });
  return res;
};

// #endregion functions

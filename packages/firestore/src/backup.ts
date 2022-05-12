import admin, { firestore } from "firebase-admin";

import { Collection } from "@eisbuk/shared";
import {
  IOperationFailure,
  IOperationSuccess,
  IOrgRootData,
  ISubCollectionData,
  ISubCollectionPath,
  ISubCollections,
  Errors,
} from "./types";

/**
 * getOrg - Returns a single organization by id
 * @param orgId - An organization id
 * @returns An organizations id and root document data: { id: string, data: DocumentData }
 */
export async function getOrg(
  orgId: string
): Promise<IOperationSuccess<IOrgRootData> | IOperationFailure> {
  try {
    const db = admin.firestore();
    const orgPath = `${Collection.Organizations}/${orgId}`;

    const orgRef = db.doc(orgPath);

    const orgSnap = await orgRef.get();
    const orgData = orgSnap.data();

    if (!orgSnap.exists) {
      throw new Error(Errors.EMPTY_DOC);
    }

    const org = { id: orgId, data: orgData };

    return { ok: true, data: org };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

/**
 * getOrgs - Lists all Organizations
 * @returns An array of Organizations: { id: string, data: DocumentData }
 */
export async function getOrgs(): Promise<
  IOperationSuccess<IOrgRootData[]> | IOperationFailure
> {
  const db = admin.firestore();

  const orgs: IOrgRootData[] = [];

  try {
    const orgsRef = db.collection(Collection.Organizations);
    const orgsSnapshot = await orgsRef.get();

    if (orgsSnapshot.empty) {
      throw new Error(Errors.EMPTY_COLLECTION);
    }

    orgsSnapshot.forEach((docRef) => {
      const id = docRef.id;
      const data = docRef.data();

      orgs.push({ id, data });
    });

    return { ok: true, data: orgs };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

/**
 * getAllSubCollections - Returns all subcollection data for a specified org
 * @param {string} orgId - An organization id
 * @returns An object of subcollections data
 *  where the key = the subcollectionid, and the value = an object of subcolletion documents
 */
export async function getAllSubCollections(
  orgId: string
): Promise<ISubCollections> {
  const paths = await getOrgSubCollectionPaths(orgId);

  if (!paths.length) {
    return {};
  }

  const subCollectionKeys = paths.map(({ id }) => id);

  const subCollectionDataPromises = paths.map(({ path }) =>
    getSubCollectionData(path)
  );
  const subCollectionData = await Promise.all(subCollectionDataPromises);

  const subCollections = subCollectionKeys.map((key, ix) => {
    const value = subCollectionData[ix];
    return [key, value] as [string, { [k: string]: firestore.DocumentData }];
  });

  return Object.fromEntries(subCollections);
}

/**
 * getSubCollectionData - Returns all documents for a specified subcollection
 * @param {string} path - A full path to a subcollection e.g `Organizations/{OrgId}/{SubCollection}`
 * @returns An object of subcollection documents,
 *  where the key = the document id, and the value = the documentData
 */
export async function getSubCollectionData(
  path: string
): Promise<ISubCollectionData> {
  const db = admin.firestore();

  const subCollctionRef = db.collection(path);
  const subCollectionSnap = await subCollctionRef.get();

  if (subCollectionSnap.empty) {
    return {};
  }

  const subCollectionData: Array<[string, firestore.DocumentData]> = [];

  subCollectionSnap.forEach((docRef) => {
    const docId = docRef.id;
    const docData = docRef.data();

    subCollectionData.push([docId, docData]);
  });

  return Object.fromEntries(subCollectionData);
}

/**
 * getOrgSubCollectionPaths - Returns a list of all the subcollections under a specified organization
 * @param {string} orgId - An organization id
 * @Returns An array of subcollection paths: { id: string, path: string }
 *  where 'id' = the collection key, and 'path' = the full path to the collection
 */
export async function getOrgSubCollectionPaths(
  orgId: string
): Promise<ISubCollectionPath[]> {
  const db = admin.firestore();
  const orgDocPath = `${Collection.Organizations}/${orgId}`;

  const subCollectionPaths: ISubCollectionPath[] = [];
  const subCollectionSnap = await db.doc(orgDocPath).listCollections();

  subCollectionSnap.forEach((collection) => {
    const path = `${orgDocPath}/${collection.id}`;
    subCollectionPaths.push({ id: collection.id, path });
  });

  return subCollectionPaths;
}

import admin, { firestore } from "firebase-admin";
import { Collection } from "@eisbuk/shared";

interface OperationSuccess<T> {
  ok: true;
  data: T;
}

interface OperationFailure {
  ok: false;
  message: string;
}

interface orgData {
  id: string;
  data: firestore.DocumentData;
}

interface subcollectionPath {
  id: string;
  path: string;
}

const db = admin.firestore();

/**
 * getOrgs - Lists all orgs
 */
export async function getOrgs(): Promise<
  OperationSuccess<orgData[]> | OperationFailure
> {
  const orgs: orgData[] = [];

  try {
    const orgsRef = await db.collection(Collection.Organizations);
    const orgsSnapshot = await orgsRef.get();

    if (orgsSnapshot.empty) {
      return { ok: false, message: "No organizations in collection." };
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
 * getSubCollectionPaths - Retreive a list of subcolleciton paths
 */
export async function getSubCollectionPaths(
  org: string
): Promise<subcollectionPath[]> {
  const subCollectionPaths: subcollectionPath[] = [];
  const subCollectionSnap = await db
    .doc(`${Collection.Organizations}/${org}`)
    .listCollections();

  subCollectionSnap.forEach((collection) => {
    const path = `${Collection.Organizations}/${org}/${collection.id}`;
    subCollectionPaths.push({ id: collection.id, path });
  });

  return subCollectionPaths;
}

/**
 * getSubCollectionData - Retrieve subcollection data at a specified path
 */
export async function getSubCollectionData(path: string): Promise<{
  [k: string]: firestore.DocumentData;
}> {
  const subCollctionRef = await db.collection(path);
  const subCollectionSnap = await subCollctionRef.get();

  const subCollectionData: Array<[string, firestore.DocumentData]> = [];

  subCollectionSnap.forEach((docRef) => {
    const docId = docRef.id;
    const docData = docRef.data();

    subCollectionData.push([docId, docData]);
  });

  return Object.fromEntries(subCollectionData);
}

/**
 * getAllSubCollectionData - Retreive all subcollection data for a specified org
 */
export async function getAllSubCollectionData(org: string): Promise<{
  [k: string]: {
    [k: string]: firestore.DocumentData;
  };
}> {
  const paths = await getSubCollectionPaths(org);

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

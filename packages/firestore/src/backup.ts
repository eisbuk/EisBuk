import admin, { firestore } from "firebase-admin";

import { Collection } from "@eisbuk/shared";
import {
  IOperationFailure,
  IOperationSuccess,
  IOrgData,
  IOrgRootData,
  ISubCollectionData,
  ISubCollectionPath,
  ISubCollections,
} from "./types";

/**
 * getOrgData - Retrieve all data for a specified organisation
 */
export async function getOrgData(org: IOrgRootData): Promise<IOrgData> {
  const subCollectionData = await getAllSubCollectionData(org.id);

  const orgData = { subCollections: subCollectionData, ...org };

  return orgData;
}

/**
 * getOrgs - Lists all orgs
 */
export async function getOrgs(): Promise<
  IOperationSuccess<IOrgRootData[]> | IOperationFailure
> {
  /**
   * @DELETE_THIS_COMMENT This, as mentioned, is initialized here (and below in each function), rather than top level for the reasons I've mentioned on Slack.
   * I'm not 100% positive the reason for failing is exact as I've described it, but this way it kinda worked rather than failing immediately
   */
  const db = admin.firestore();

  const orgs: IOrgRootData[] = [];

  try {
    const orgsRef = db.collection(Collection.Organizations);
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
 * getAllSubCollectionData - Retreive all subcollection data for a specified org
 */
export async function getAllSubCollectionData(
  org: string
): Promise<ISubCollections> {
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

/**
 * getSubCollectionData - Retrieve subcollection data at a specified path
 */
export async function getSubCollectionData(
  path: string
): Promise<ISubCollectionData> {
  const db = admin.firestore();

  const subCollctionRef = db.collection(path);
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
 * getSubCollectionPaths - Retreive a list of subcolleciton paths
 */
export async function getSubCollectionPaths(
  org: string
): Promise<ISubCollectionPath[]> {
  const db = admin.firestore();

  const subCollectionPaths: ISubCollectionPath[] = [];
  const subCollectionSnap = await db
    .doc(`${Collection.Organizations}/${org}`)
    .listCollections();

  subCollectionSnap.forEach((collection) => {
    const path = `${Collection.Organizations}/${org}/${collection.id}`;
    subCollectionPaths.push({ id: collection.id, path });
  });

  return subCollectionPaths;
}

import fs from "fs/promises";
import path from "path";
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

interface OrgData extends OrgRootData {
  subCollections: SubCollections;
}

interface OrgRootData {
  id: string;
  data: firestore.DocumentData;
}

interface SubCollections {
  [k: string]: SubCollectionData;
}

interface SubCollectionData {
  [k: string]: firestore.DocumentData;
}

interface SubCollectionPath {
  id: string;
  path: string;
}

const db = admin.firestore();

/**
 * backup
 */
export async function backup(): Promise<
  OperationSuccess<string> | OperationFailure
> {
  try {
    const orgDataOp = await getAllOrgData();

    if (orgDataOp.ok) {
      const writeDataOps = orgDataOp.data.map(async (orgData) => {
        const fileName = `${orgData.id}.json`;
        const filePath = path.resolve(process.cwd(), fileName);

        const orgDataJson = JSON.stringify(orgData);

        await fs.writeFile(filePath, orgDataJson, "utf-8");
      });

      await Promise.all(writeDataOps);

      return { ok: true, data: "OK" };
    } else {
      throw new Error(orgDataOp.message);
    }
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

/**
 * getAllOrgData - Retrieve all data for all orgs
 */
export async function getAllOrgData(): Promise<
  OperationSuccess<OrgData[]> | OperationFailure
> {
  try {
    const orgsOp = await getOrgs();

    if (orgsOp.ok === true) {
      const orgs = orgsOp.data;

      const getFullOrgDataOps = orgs.map(getOrgData);

      const orgData = await Promise.all(getFullOrgDataOps);

      return { ok: true, data: orgData };
    } else {
      throw new Error(orgsOp.message);
    }
  } catch (err: any) {
    return { ok: false, message: err };
  }
}

/**
 * getOrgData - Retrieve all data for a specified organisation
 */
export async function getOrgData(org: OrgRootData): Promise<OrgData> {
  const subCollectionData = await getAllSubCollectionData(org.id);

  const orgData = { subCollections: subCollectionData, ...org };

  return orgData;
}

/**
 * getOrgs - Lists all orgs
 */
export async function getOrgs(): Promise<
  OperationSuccess<OrgRootData[]> | OperationFailure
> {
  const orgs: OrgRootData[] = [];

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
 * getAllSubCollectionData - Retreive all subcollection data for a specified org
 */
export async function getAllSubCollectionData(
  org: string
): Promise<SubCollections> {
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
): Promise<SubCollectionData> {
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
 * getSubCollectionPaths - Retreive a list of subcolleciton paths
 */
export async function getSubCollectionPaths(
  org: string
): Promise<SubCollectionPath[]> {
  const subCollectionPaths: SubCollectionPath[] = [];
  const subCollectionSnap = await db
    .doc(`${Collection.Organizations}/${org}`)
    .listCollections();

  subCollectionSnap.forEach((collection) => {
    const path = `${Collection.Organizations}/${org}/${collection.id}`;
    subCollectionPaths.push({ id: collection.id, path });
  });

  return subCollectionPaths;
}

import admin, { firestore } from "firebase-admin";

import { Collection } from "@eisbuk/shared";
import {
  IOperationFailure,
  IOperationSuccess,
  IOrgRootData,
  IOrgData,
  ISubCollectionData,
} from "../lib/types";

//* * #region restoreScripts */

/**
 * restoreOrganizations - Set all data for an array of organizations
 * @param {IOrgData[]} orgs - An array of organizations to write: { id, data, subCollections }
 */
export async function restoreOrganizations(
  orgs: IOrgData[]
): Promise<IOperationSuccess<string> | IOperationFailure> {
  try {
    const writeOrgOps = orgs.map(async (org) => {
      await setOrganization(org);
    });

    await Promise.all(writeOrgOps);

    return { ok: true, data: "OK" };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

//* #endregion restoreScripts */

//* * #region restoreUtils */

/**
 * setOrganization - Set all organisation data
 */
export async function setOrganization({
  id,
  data,
  subCollections,
}: IOrgData): Promise<void> {
  const setOrgRootDataOp = await setOrgRootData({ id, data });

  if (!setOrgRootDataOp.ok) {
    throw new Error(setOrgRootDataOp.message);
  }

  const setOrgSubCollecitonOps = await setOrgSubCollections({
    id,
    subCollections,
  });

  if (!setOrgSubCollecitonOps.ok) {
    throw new Error(setOrgSubCollecitonOps.message);
  }

  return;
}

/**
 * setOrgRootData - Set organization root doc data
 * @returns "OK" on success; error message on failure
 */
export async function setOrgRootData({
  id,
  data,
}: IOrgRootData): Promise<IOperationSuccess<string> | IOperationFailure> {
  const db = admin.firestore();

  try {
    const path = `${Collection.Organizations}/${id}`;
    await db.doc(path).set(data as firestore.DocumentData);

    return { ok: true, data: "OK" };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

/**
 * setOrgSubCollections - Set all docs for an array of subcollections
 * @param {Object} orgData - Organization data: { id, subCollections }
 * @param {string} orgData.id - An organizations id
 * @param {ISubCollections} orgData.subCollections - An object of subcollections data
 */
export async function setOrgSubCollections({
  id: orgId,
  subCollections,
}: Pick<IOrgData, "id" | "subCollections">): Promise<
  IOperationSuccess<string> | IOperationFailure
> {
  const orgPath = `${Collection.Organizations}/${orgId}`;

  const subCollectionsArr = Object.entries(subCollections);

  const setSubCollectionDataOps = subCollectionsArr.map(
    async ([subId, subData]) => {
      const subPath = `${orgPath}/${subId}`;

      return await setSubCollectionData(subPath, subData);
    }
  );

  try {
    await Promise.all(setSubCollectionDataOps);

    return { ok: true, data: "OK" };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

/**
 * setSubCollectionData - Set an array of individual docs in a specified subcollection
 * @param path - SubCollection path: e.g Organisations/orgId/SubCollection
 * @param data - SubCollection data obj: e.g { key = docId, value = data }
 */
export async function setSubCollectionData(
  path: string,
  data: ISubCollectionData
): Promise<void> {
  const db = admin.firestore();

  const subDocumentDataArr = Object.entries(data);

  const subDocWriteOps = subDocumentDataArr.map(async ([docId, docData]) => {
    const docPath = `${path}/${docId}`;

    return await db.doc(docPath).set(docData);
  });

  await Promise.all(subDocWriteOps);
  return;
}

//* #endregion restoreUtils */

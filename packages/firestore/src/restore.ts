import admin from "firebase-admin";

import { Collection } from "@eisbuk/shared";
import {
  IOperationFailure,
  IOperationSuccess,
  IOrgRootData,
  IOrgData,
  ISubCollectionData,
} from "./types";

/**
 * setAllOrganisationData() - Set all organisation data
 */
export async function setAllOrganisationData({
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
 * setOrgRootData - Set organisation root doc data
 */
export async function setOrgRootData({
  id,
  data,
}: IOrgRootData): Promise<IOperationSuccess<string> | IOperationFailure> {
  const db = admin.firestore();

  try {
    const path = `${Collection.Organizations}/${id}`;
    await db.doc(path).set(data);

    return { ok: true, data: "OK" };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

/**
 * setOrgSubCollections - Set all docs in an array of subcollections
 */
export async function setOrgSubCollections({
  id,
  subCollections,
}: Pick<IOrgData, "id" | "subCollections">): Promise<
  IOperationSuccess<string> | IOperationFailure
> {
  const orgPath = `${Collection.Organizations}/${id}`;

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

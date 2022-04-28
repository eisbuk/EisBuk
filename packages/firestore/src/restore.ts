import admin from "firebase-admin";

import { Collection } from "@eisbuk/shared";
import {
  IOperationFailure,
  IOperationSuccess,
  IOrgRootData,
  ISubCollectionData,
} from "./types";

/**
 * setOrgRootData - Set organisation data
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

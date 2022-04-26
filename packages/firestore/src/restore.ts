import admin from "firebase-admin";

import { Collection } from "@eisbuk/shared";
import { IOperationFailure, IOperationSuccess, IOrgRootData } from "./types";

const db = admin.firestore();

/**
 * setOrgRootData - Set organisation data
 */
export async function setOrgRootData({
  id,
  data,
}: IOrgRootData): Promise<IOperationSuccess<string> | IOperationFailure> {
  try {
    const path = `${Collection.Organizations}/${id}`;
    await db.doc(path).set(data);

    return { ok: true, data: "OK" };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

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

/**
 * getOrgs - Lists all orgs
 */
export async function getOrgs(): Promise<
  OperationSuccess<orgData[]> | OperationFailure
> {
  const orgs: orgData[] = [];

  const db = admin.firestore();

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

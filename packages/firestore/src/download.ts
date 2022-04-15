import admin from "firebase-admin";
import { Collection } from "@eisbuk/shared";

/**
 * listOrgs - Lists all orgs
 */
export async function listOrgs(): Promise<string[]> {
  const orgs: string[] = [];

  const db = admin.firestore();

  const orgsRef = await db.collection(Collection.Organizations);
  const orgsSnapshot = await orgsRef.get();

  // TODO: Error handling.

  orgsSnapshot.forEach((docRef) => {
    orgs.push(docRef.id);
  });

  return orgs;
}

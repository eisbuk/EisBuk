import { getFirestore, doc, setDoc } from "@firebase/firestore";

import { Collection, OrgMailConfig } from "eisbuk-shared";

import { getOrganization } from "@/lib/getters";

import { FirestoreThunk } from "@/types/store";

/**
 * Creates a thunk in charge of updating `mailConfig` of an organization
 * entry in firestore
 * @param mailConfig
 * @returns firestore thunk
 */
export const updateMailConfig =
  (mailConfig: OrgMailConfig): FirestoreThunk =>
  async () => {
    const docRef = doc(
      getFirestore(),
      Collection.Organizations,
      getOrganization()
    );
    await setDoc(docRef, { mailConfig }, { merge: true });
  };

import firebase from "firebase/app";
import axios from "axios";
import { adminDb } from "./settings";
import "firebase/auth";
import { ORGANIZATION } from "@/config/envInfo";
import { Collection, OrgSubCollection } from "eisbuk-shared/dist";

/**
 * @param email
 */
export const loginWithUser = async (email: string): Promise<void> => {
  try {
    await firebase.auth().createUserWithEmailAndPassword(email, "secret");
  } catch (e) {
    await firebase.auth().signInWithEmailAndPassword(email, "secret");
  }
};

/**
 * Test util: creates default organization ("default") in emulated firestore db
 * and adds admin ("test@example.com")
 * @returns
 */
export const createDefaultOrg = (): Promise<FirebaseFirestore.WriteResult> => {
  const orgDefinition = {
    admins: ["test@example.com"],
  };

  return adminDb.collection("organizations").doc("default").set(orgDefinition);
};

/**
 * Test util: loggs in with default user's email ("test@example.com")
 * @returns
 */
export const loginDefaultUser = (): Promise<void> => {
  return loginWithUser("test@example.com");
};

/**
 * Test util: deletes provided collections from "default" organization in emulated firestore db
 * @param collections to delete
 * @returns
 */
export const deleteAll = async (): Promise<FirebaseFirestore.WriteResult[]> => {
  const org = adminDb.collection(Collection.Organizations).doc(ORGANIZATION);

  return deleteAllCollections(org, Object.values(OrgSubCollection));
};

/**
 * Test util: deletes provided collections from provided db
 * @param db to delete from
 * @param collections to delete
 * @returns
 */
export const deleteAllCollections = async (
  db:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Firestore,
  collections: string[]
): Promise<FirebaseFirestore.WriteResult[]> => {
  const toDelete: Promise<FirebaseFirestore.WriteResult>[] = [];

  for (const coll of collections) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await db.collection(coll).get();
    existing.forEach((el) => {
      toDelete.push(el.ref.delete());
    });
  }

  return Promise.all(toDelete);
};

/**
 * Test util: loggs in with phone number
 * @param phoneNumber
 * @returns
 */
export const loginWithPhone = async (
  phoneNumber: string
): Promise<firebase.auth.UserCredential> => {
  // Turn off phone auth app verification.
  firebase.auth().settings.appVerificationDisabledForTesting = true;

  const verifier = new firebase.auth.RecaptchaVerifier(
    document.createElement("div")
  );
  jest
    .spyOn(verifier, "verify")
    .mockImplementation(() => Promise.resolve("foo"));
  const confirmationResult = await firebase
    .auth()
    .signInWithPhoneNumber(phoneNumber, verifier);
  const response = await axios.get(
    "http://localhost:9098/emulator/v1/projects/eisbuk/verificationCodes"
  );
  let verificationCode = "foo";
  for (let i = 0; i < response.data.verificationCodes.length; i++) {
    const element = response.data.verificationCodes[i];
    if (element.phoneNumber === phoneNumber) {
      verificationCode = element.code;
    }
  }
  return confirmationResult.confirm(verificationCode);
};

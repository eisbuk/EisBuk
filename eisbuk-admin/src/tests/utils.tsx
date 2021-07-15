import firebase from "firebase/app";
import axios from "axios";
import { adminDb } from "./settings";
import "firebase/auth";

interface RetryHelper {
  <T>(
    func: (...args: any[]) => Promise<T>,
    maxTries: number,
    delay: number
  ): Promise<T>;
}

/**
 * Test util: runs procided function until success or maxTries reached, with specified delay
 * @param func function to run
 * @param maxTries
 * @param delay between runs
 * @returns
 */
export const retry: RetryHelper = async (func, maxTries, delay) => {
  // Retry running the (asyncrhronous) function func
  // until it resolves
  let reTry = 0;
  return new Promise((resolve, reject) => {
    function callFunc() {
      try {
        func().then(resolve, (reason) => {
          if (++reTry >= maxTries) {
            reject(reason);
          } else {
            setTimeout(
              callFunc,
              typeof delay == "function" ? (delay as any)(retry) : delay
            );
          }
        });
      } catch (e) {
        reject(e);
      }
    }
    callFunc();
  });
};

// The following function currently fails because of this issue
// with the jsdom implementation of pre-flight CORS check:
// https://github.com/jsdom/jsdom/pull/2867
// For now you need to patch your local copy manually
// A script `fix_jsdom.sh" is provided for this purpose
/**
 *
 * @param email
 */
export const loginWithUser = async (email: string) => {
  try {
    await firebase.auth().createUserWithEmailAndPassword(email, "secret");
  } catch (e) {
    await firebase.auth().signInWithEmailAndPassword(email, "secret");
  }
};

/**
 * Test util: deletes default organization ("default") from emulated firestore db
 * @returns
 */
export const createDefaultOrg = () => {
  const orgDefinition = {
    admins: ["test@example.com"],
  };
  return adminDb.collection("organizations").doc("default").set(orgDefinition);
};

/**
 * Test util: loggs in with default user's email ("test@example.com")
 * @returns
 */
export const loginDefaultUser = function () {
  return exports.loginWithUser("test@example.com");
};

/**
 * Test util: deletes provided collections from "default" organization in emulated firestore db
 * @param collections to delete
 * @returns
 */
export const deleteAll = async (collections: string[]) => {
  const org = adminDb.collection("organizations").doc("default");
  return deleteAllCollections(org, collections);
};

/**
 * Test util: deletes provided collections from provided provided db
 * @param db to delete from
 * @param collections to delete
 * @returns
 */
export const deleteAllCollections = async (
  db:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Firestore,
  collections: string[]
) => {
  const toDelete: Promise<FirebaseFirestore.WriteResult>[] = [];

  for (const coll of collections) {
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
export const loginWithPhone = async (phoneNumber: string) => {
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
  var verificationCode = "foo";
  for (let i = 0; i < response.data.verificationCodes.length; i++) {
    const element = response.data.verificationCodes[i];
    if (element.phoneNumber === phoneNumber) {
      verificationCode = element.code;
    }
  }
  return confirmationResult.confirm(verificationCode);
};

/**
 * This file contains all of the firestore setup for tests:
 * - `adminDb` allowing us to run all firestore operations as an admin (and bypass auth)
 *
 * - `app` an initalization of firebase (client) app
 * - `db` a client SDK version of firestore db (and it's setup)
 * - `auth` an initialized firebase (client) auth object
 * - `functions` initialized firebase (client) SDK functions with region "europe-west6"
 */
import { initializeApp } from "@firebase/app";
import { getFirestore, connectFirestoreEmulator } from "@firebase/firestore";
import { getAuth, connectAuthEmulator } from "@firebase/auth";

// #region clientSDK
const projectId = "eisbuk";

const app = initializeApp({
  projectId,
  apiKey: "aaa",
});

export const organization = "test-organization";

export const auth = getAuth(app);
connectAuthEmulator(auth, "http://localhost:9098");

export const db = getFirestore();
connectFirestoreEmulator(db, "localhost", 8081);
// #endregion clientSDK

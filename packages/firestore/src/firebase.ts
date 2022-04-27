import admin from "firebase-admin";

/** @DELETE_THIS_COMMENT __withEmulators__ tells you if we're using emulators, while __isTest__ actually tells you if we're in a test environment */
const __isTest__ = process.env.NODE_ENV === "test";

const projectId = process.env.FIREBASE_CREDENTIALS_project_id ?? "";
const clientEmail = process.env.FIREBASE_CREDENTIALS_client_email ?? "";

const _privateKey = process.env.FIREBASE_CREDENTIALS_private_key;
const privateKey = _privateKey ? _privateKey.replace(/\\n/g, "n") : "";

if (!__isTest__) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  /** @DELETE_THIS_COMMENT here I've commented out the following as I think that with mocking, it's no longer necessary  */
  // } else {
  //   const firestore = admin.firestore();

  //   firestore.settings({
  //     host: "localhost:8080",
  //     ssl: false,
  //   });
}

import admin from "firebase-admin";

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
}

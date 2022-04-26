import admin from "firebase-admin";

/**
 * A boolean flag set to `true` if the emulators exist in current environment
 */
const __withEmulators__ = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const projectId = process.env.FIREBASE_CREDENTIALS_project_id ?? "";
const clientEmail = process.env.FIREBASE_CREDENTIALS_client_email ?? "";

const _privateKey = process.env.FIREBASE_CREDENTIALS_private_key;
const privateKey = _privateKey ? _privateKey.replace(/\\n/g, "n") : "";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

if (__withEmulators__) {
  const firestore = admin.firestore();

  firestore.settings({
    host: "localhost:8080",
    ssl: false,
  });
}

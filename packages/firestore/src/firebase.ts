import admin from "firebase-admin";

/**
 * A boolean flag set to `true` if the emulators exist in current environment
 */
const __withEmulators__ = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_CREDENTIALS_project_id,
    clientEmail: process.env.FIREBASE_CREDENTIALS_client_email,
    privateKey: process.env.FIREBASE_CREDENTIALS_private_key?.replace(
      /\\n/g,
      "n"
    ),
  }),
});

if (__withEmulators__) {
  const firestore = admin.firestore();

  firestore.settings({
    host: "localhost:8080",
    ssl: false,
  });
}

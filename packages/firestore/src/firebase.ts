import admin from "firebase-admin";

import { __withEmulators__ } from "@eisbuk/client/src/__testUtils__/envUtils";

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

import admin from "firebase-admin";

process.env["FIRESTORE_EMULATOR_HOST"] =
  process.env["FIRESTORE_EMULATOR_HOST"] || "127.0.0.1:8080";

admin.initializeApp({ projectId: "eisbuk" });
export const adminDb = admin.firestore();

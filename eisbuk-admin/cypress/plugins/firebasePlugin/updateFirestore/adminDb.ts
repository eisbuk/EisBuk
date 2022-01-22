import admin from "firebase-admin";

process.env["FIRESTORE_EMULATOR_HOST"] =
  process.env["FIRESTORE_EMULATOR_HOST"] || "localhost:8080";

admin.initializeApp({ projectId: "eisbuk" });
export const adminDb = admin.firestore();

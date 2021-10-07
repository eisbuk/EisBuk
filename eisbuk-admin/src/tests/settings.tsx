import { initializeApp, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { Firestore } from "@google-cloud/firestore";
import { credentials } from "@grpc/grpc-js";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const projectId = "eisbuk";

export const adminDb = new Firestore({
  projectId,
  servicePath: "localhost",
  port: 8081,
  sslCreds: credentials.createInsecure(),
  customHeaders: {
    Authorization: "Bearer owner",
  },
});

// if (!getApp()) {
initializeApp({
  projectId: projectId,
  apiKey: "aaa",
});
// }

export const auth = getAuth();
connectAuthEmulator(auth, "http://localhost:9098");

export const db = getFirestore();
connectFirestoreEmulator(db, "localhost", 8081);

export const functions = getFunctions(getApp());
connectFunctionsEmulator(functions, "localhost", 5002);

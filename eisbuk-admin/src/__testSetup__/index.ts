import { initializeApp } from "@firebase/app";
import { getFirestore, connectFirestoreEmulator } from "@firebase/firestore";
import { getAuth, connectAuthEmulator } from "@firebase/auth";
import { Firestore } from "@google-cloud/firestore";
import { credentials } from "@grpc/grpc-js";

import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const projectId = "eisbuk";

const app = initializeApp({
  projectId,
  apiKey: "aaa",
});

export const adminDb = new Firestore({
  options: {
    servicePath: "localhost",
    port: 8081,
    sslCreds: credentials.createInsecure(),
    customHeaders: {
      Authorization: "Bearer owner",
    },
  },
});

export const auth = getAuth();
connectAuthEmulator(auth, "http://localhost:9098");

export const db = getFirestore();
connectFirestoreEmulator(db, "localhost", 8081);

export const functions = getFunctions(app, "europe-west6");
connectFunctionsEmulator(functions, "localhost", 5002);

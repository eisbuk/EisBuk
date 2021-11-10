/* eslint-disable import/no-duplicates */
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/functions";
import "firebase/firestore";
import { Firestore } from "@google-cloud/firestore";
import { credentials } from "@grpc/grpc-js";

import { __functionsZone__ } from "@/lib/constants";

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

if (!firebase.apps.length) {
  firebase.initializeApp({
    projectId: projectId,
    apiKey: "aaa",
  });
  firebase.auth().useEmulator("http://localhost:9098/");
  firebase.functions().useEmulator("localhost", 5002);
  firebase.app().functions(__functionsZone__).useEmulator("localhost", 5002);
  firebase.firestore().settings({
    host: "localhost:8081",
    ssl: false,
  });
}

export const db = firebase.firestore();

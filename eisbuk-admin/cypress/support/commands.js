import { initializeApp } from "@firebase/app";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "@firebase/functions";
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "@firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
  getFirestore,
} from "@firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { CloudFunction } from "@/enums/functions";

import { defaultUser } from "@/__testSetup__/envData";

// create a new app and connect SDK to emulators
const app = initializeApp({ projectId: "eisbuk", apiKey: "fake-key" });
initializeFirestore(app, {});

const auth = getAuth(app);
connectAuthEmulator(auth, "http://localhost:9099");

const db = getFirestore(app);
connectFirestoreEmulator(db, "localhost", 8080);

const functions = getFunctions(app, "europe-west6");
connectFunctionsEmulator(functions, "localhost", 5001);

/**
 * Set up app for testing and log in as default admin
 */
Cypress.Commands.add("initAdminApp", () => {
  // create a random organization name in order to run each test
  // against it's own organization, using the same db without conflicts
  const organization = uuidv4();
  cy.on("window:before:load", (win) => {
    // the `organization` name is set to local storage and read from the app while testing
    win.localStorage.setItem("organization", organization);
  });

  // create or login a default user in order to run the tests with admin access
  createUserWithEmailAndPassword(
    auth,
    defaultUser.email,
    defaultUser.password
  ).catch(() => {
    signInWithEmailAndPassword(auth, defaultUser.email, defaultUser.password);
  });

  // create a default organization (containing the default user as an admin)
  httpsCallable(
    functions,
    CloudFunction.CreateOrganization
  )({ organization }).catch();
});

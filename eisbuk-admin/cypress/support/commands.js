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
  signOut,
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
 * @param {boolean} doLogin - whether to log in as default admin
 */
Cypress.Commands.add("initAdminApp", async (doLogin = true) => {
  // create a random organization name in order to run each test
  // against it's own organization, using the same db without conflicts
  const organization = uuidv4();
  cy.on("window:before:load", (win) => {
    // the `organization` name is set to local storage and read from the app while testing
    win.localStorage.setItem("organization", organization);
  });
  // create a default organization (containing the default user as an admin)
  await httpsCallable(
    functions,
    CloudFunction.CreateOrganization
  )({ organization });

  // Always create a user (and maybe log them out)
  try {
    await createUserWithEmailAndPassword(
      auth,
      defaultUser.email,
      defaultUser.password
    );
    if (!doLogin) {
      await signOut(auth);
    }
  } catch (error) {
    if (doLogin) {
      await signInWithEmailAndPassword(
        auth,
        defaultUser.email,
        defaultUser.password
      );
      console.log(`Logged in as ${defaultUser.email}`);
    } else {
      await signOut(auth);
      console.log(`Logged out`);
    }
  }
});

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
  signOut,
  UserCredential,
} from "@firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
  getFirestore,
} from "@firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { CloudFunction } from "@/enums/functions";

import { defaultUser } from "@/__testSetup__/envData";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Run this command before each test in order to test the app with admin access, it:
       * - initializes a new `eisbuk` app
       * - creates a random name organization and adds organization name to local storage
       * - creates a default organization with given name
       * - creates a default user (admin of organization)
       * @returns {Chainable<string>} a `PromiseLike` which yielding `string` a name of the current organization
       */
      initAdminApp: () => Chainable<string>;
      /**
       * A sort of a proxy handler: passes organization and file names back to node environment
       * process (using `cy.task` API). The files get read and parsed (JSON)
       * and firestore gets updated with combined test data (read from all fo the provided files)
       * @param {string} organization the unique name of the firestore organization used for current test
       * @param {string[]} files an array of names of the JSON files containing test data
       * @returns {Chainable<null>} a `PromiseLike` yielding `null` on success
       */
      updateFirestore: (
        organization: string,
        files: string[]
      ) => Chainable<null>;
      /**
       * Retrieve recaptcha code from auth emulator
       * @param {string} phone phone number we're using to register
       * @returns {Chainable<number>} a `PromiseLike` yielding code string on success
       */
      getRecaptchaCode: (
        phone: string,
        projectId?: string
      ) => Chainable<string>;
      /**
       * Retrieve email sign-in link from auth emulator
       * @param {string} email we're using to register
       * @returns {Chainable<number>} a `PromiseLike` yielding sign-in link string on success
       */
      getSigninLink: (phone: string, projectId?: string) => Chainable<string>;
      /**
       * Sign into of firebase with default user
       */
      signIn: () => Chainable<UserCredential>;
      /**
       * Sign out of firebase
       */
      signOut: () => Chainable<void>;
    }
  }
}

// create a new app and connect SDK to emulators
const app = initializeApp({ projectId: "eisbuk", apiKey: "api-key" });
initializeFirestore(app, {});

const auth = getAuth(app);
connectAuthEmulator(auth, "http://localhost:9099");

const db = getFirestore(app);
connectFirestoreEmulator(db, "localhost", 8080);

const functions = getFunctions(app, "europe-west6");
connectFunctionsEmulator(functions, "localhost", 5001);

/**
 * A procedure used to register custom firebase commands in form of `cy[command]`.
 *
 * This part of the code runs in browser environment so browser global objects
 * like `window` and `localStorage` are available. All of the "background" node
 * environment operations are communicated through `cy.task` api and handled on the
 * plugin side of cypress (instantiated with `firebasePlugin` procedure)
 */
const addFirebaseCommands = (): void => {
  /**
   * Set up app for testing
   */
  Cypress.Commands.add("initAdminApp", async () => {
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
      CloudFunction.CreateDefaultUser
    )({ organization });

    return organization;
  });

  Cypress.Commands.add(
    "updateFirestore",
    (organization: string, files: string[]) => {
      cy.task("updateFirestore", { organization, files });
    }
  );

  Cypress.Commands.add(
    "getRecaptchaCode",
    (phone: string, projectId = "eisbuk") =>
      cy.task("getRecaptchaCode", { phone, projectId })
  );

  Cypress.Commands.add("getSigninLink", (email: string, projectId = "eisbuk") =>
    cy.task("getSigninLink", { email, projectId })
  );

  Cypress.Commands.add("signOut", () => signOut(getAuth()));

  Cypress.Commands.add("signIn", () =>
    signInWithEmailAndPassword(auth, defaultUser.email, defaultUser.password)
  );
};

export default addFirebaseCommands;

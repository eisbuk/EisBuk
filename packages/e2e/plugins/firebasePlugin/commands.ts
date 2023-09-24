import { initializeApp } from "@firebase/app";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
  HttpsCallableResult,
} from "@firebase/functions";
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
} from "@firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
  getFirestore,
} from "@firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import {
  CreateAuthUserPayload,
  Customer,
  CustomerBookings,
  OrganizationData,
  SlotAttendnace,
  SlotInterface,
} from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";
import { defaultUser } from "@eisbuk/testing/envData";

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
      initAdminApp(): Chainable<string>;
      /**
       * Create a user in firebase auth and (optionally), if admin to firestore organization
       */
      addAuthUser(
        payload: CreateAuthUserPayload
      ): Chainable<HttpsCallableResult>;
      /** */
      updateOrganization(
        organization: string,
        documents: OrganizationData
      ): Chainable<string>;
      /** */
      updateSlots(
        organization: string,
        documents: Record<string, SlotInterface>
      ): Chainable<string>;
      /** */
      updateCustomers(
        organization: string,
        documents: Record<string, Customer>
      ): Chainable<string>;
      /** */
      updateBookings(
        organization: string,
        documents: Record<string, CustomerBookings>
      ): Chainable<string>;
      /** */
      updateAttendance(
        organization: string,
        documents: Record<string, SlotAttendnace>
      ): Chainable<string>;
      /**
       * Retrieve recaptcha code from auth emulator
       * @param {string} phone phone number we're using to register
       * @returns {Chainable<number>} a `PromiseLike` yielding code string on success
       */
      getRecaptchaCode(phone: string, projectId?: string): Chainable<string>;
      /**
       * Retrieve email sign-in link from auth emulator
       * @param {string} phone
       * @returns {Chainable<number>} a `PromiseLike` yielding sign-in link string on success
       */
      getSigninLink(phone: string, projectId?: string): Chainable<string>;
      /**
       * Programatically sign the user up into firebase auth (if the user already exists, merely signs in)
       * @param email
       * @param password
       */
      signUp(email: string, password: string): Chainable<UserCredential>;
      /**
       * Sign into firebase with email and password
       */
      signIn(email: string, password: string): Chainable<UserCredential>;
      /**
       * Sign into firebase with default user
       */
      signIn(): Chainable<UserCredential>;
      /**
       * Sign out of firebase
       */
      signOut(): Chainable<void>;
    }
  }
}

// create a new app and connect SDK to emulators
const app = initializeApp({ projectId: "eisbuk", apiKey: "api-key" });
initializeFirestore(app, {});

const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099");

const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);

const functions = getFunctions(app, "europe-west6");
connectFunctionsEmulator(functions, "127.0.0.1", 5001);

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
  Cypress.Commands.add("initAdminApp", () => {
    // TODO: this clearcookies should in theory not be necessary: cypress should take
    // care of this. But we're observing in tests, sometimes the user is already logged
    // in, and thus the test fails.
    cy.clearCookies();
    // create a random organization name in order to run each test
    // against it's own organization, using the same db without conflicts
    const organization = uuidv4();
    cy.on("window:before:load", (win) => {
      // the `organization` name is set to local storage and read from the app while testing
      win.localStorage.setItem("organization", organization);
    });
    // create a default organization (containing the default user as an admin)
    cy.wrap(
      httpsCallable(
        functions,
        CloudFunction.CreateDefaultUser
      )({ organization })
    );
    // set up dummy smtp config in org secrets to allow for email sending (at least client side)
    cy.wrap(
      httpsCallable(
        functions,
        CloudFunction.SetupEmailForTesting
      )({ organization })
    );

    return cy.wrap(organization);
  });

  Cypress.Commands.add("addAuthUser", (payload) =>
    cy.wrap(httpsCallable(functions, CloudFunction.CreateUser)(payload))
  );

  Cypress.Commands.add(
    "updateOrganization",
    (organization: string, documents: OrganizationData) => {
      cy.task("updateOrganization", { organization, documents });
      return cy.wrap(organization);
    }
  );
  Cypress.Commands.add(
    "updateSlots",
    (organization: string, documents: Record<string, SlotInterface>) => {
      cy.task("updateSlots", { organization, documents });
      return cy.wrap(organization);
    }
  );
  Cypress.Commands.add(
    "updateCustomers",
    (organization: string, documents: Record<string, Customer>) =>
      cy
        .task("updateCustomers", { organization, documents })
        .then(() => cy.wrap(organization))
  );
  Cypress.Commands.add(
    "updateBookings",
    (organization: string, documents: Record<string, CustomerBookings>) =>
      cy
        .task("updateBookings", { organization, documents })
        .then(() => cy.wrap(organization))
  );
  Cypress.Commands.add(
    "updateAttendance",
    (organization: string, documents: Record<string, SlotAttendnace>) =>
      cy
        .task("updateAttendance", { organization, documents })
        .then(() => cy.wrap(organization))
  );

  Cypress.Commands.add(
    "getRecaptchaCode",
    (phone: string, projectId = "eisbuk") =>
      cy.task("getRecaptchaCode", { phone, projectId })
  );

  Cypress.Commands.add("getSigninLink", (email: string, projectId = "eisbuk") =>
    cy.task("getSigninLink", { email, projectId })
  );

  Cypress.Commands.add("signUp", (email: string, password: string) =>
    cy.wrap(
      createUserWithEmailAndPassword(getAuth(), email, password).catch(() =>
        signInWithEmailAndPassword(getAuth(), email, password)
      )
    )
  );

  Cypress.Commands.add("signOut", () => cy.wrap(signOut(getAuth())));

  Cypress.Commands.add("signIn", (email?: string, password?: string) => {
    if (email) {
      return cy.wrap(signInWithEmailAndPassword(auth, email, password || ""));
    }
    return cy.wrap(
      signInWithEmailAndPassword(auth, defaultUser.email, defaultUser.password)
    );
  });
};

export default addFirebaseCommands;

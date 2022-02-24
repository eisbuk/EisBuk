import {
  RulesTestContext,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setDoc, doc } from "@firebase/firestore";

import { Collection } from "eisbuk-shared";

import { defaultUser } from "@/__testSetup__/envData";

import { __organization__ } from "@/lib/constants";

export type TestEnvFirestore = ReturnType<RulesTestContext["firestore"]>;
export type ExtendedTestEnvFirestore = TestEnvFirestore & {
  testEnv: RulesTestEnvironment;
};
export type TestEnvSetup = (db: TestEnvFirestore) => Promise<void | void[]>;

interface GetTestEnv {
  (params: {
    setup?: TestEnvSetup;
    auth?: boolean;
  }): Promise<ExtendedTestEnvFirestore>;
}

/**
 * Creates a test env using `firestore/rules-unit-testing` helpers
 * @param {Object} params
 * @param {Function} params.setup optional setup function. Used to set up firestore state
 * before the test. Gets ran with firstore rules disabled,
 * accepts `db` -> a "god mode" firestore instance
 * @param {boolean} params.auth authentication flag,
 * returns auth context for `true`, unauth for `false
 * @returns test environment with respect to `auth` flag
 */
export const getTestEnv: GetTestEnv = async ({
  auth = true,
  setup = async () => {},
}) => {
  // create a unique project id for each test to run in pristine environment
  const projectId = "eisbuk";
  const testEnv = await initializeTestEnvironment({ projectId });
  // clear firestore to prevent leaking of data from other tests (as project id turned out flaky at times)
  await testEnv.clearFirestore();
  // we're generating an auth context using our `defaultUser`
  // in compliance with our `firestore.rules`, the `defaultUser` needs to be stored
  // as organization's admin in firestore for a complete `isAdmin` functionality
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, Collection.Organizations, __organization__), {
      admins: [defaultUser.email],
    });
    // run setup function if any provided
    await setup(db);
  });
  // return test context with respect to `auth`
  const db = auth
    ? testEnv
        .authenticatedContext(defaultUser.email, { email: defaultUser.email })
        .firestore()
    : testEnv.unauthenticatedContext().firestore();

  db["testEnv"] = testEnv;

  return db as ExtendedTestEnvFirestore;
};

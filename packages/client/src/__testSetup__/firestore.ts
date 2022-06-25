import { v4 as uuid } from "uuid";
import { createUserWithEmailAndPassword, signOut } from "@firebase/auth";
import { Firestore } from "@google-cloud/firestore";
import {
  RulesTestContext,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import { Collection } from "@eisbuk/shared";

import { adminDb, auth } from "./firestoreSetup";

import { __withEmulators__ } from "@/__testUtils__/envUtils";

// #region setUpOrganization
export interface TestOrganizationParams {
  organization: string;
  email: string;
  pass: string;
}

interface SetUpOrganization {
  (
    doLogin?: boolean,
    db?: ReturnType<RulesTestContext["firestore"]> | Firestore
  ): Promise<TestOrganizationParams>;
}

/**
 * Create a new uuid string for test organization and set up initial user as admin of given organization
 * @param {boolean} doLogin optional, defaults to true (if false, user is logged out after creation)
 * @param {Firestore} db optional, if not provided defaults to `adminDb` created for test
 * @returns test organization params:
 * - `organization` (organization name)
 * - `email` (generated email of created user)
 * - `pass` (generated password of created user)
 */
export const setUpOrganization: SetUpOrganization = async (
  doLogin = true,
  db = adminDb
) => {
  if (!__withEmulators__) {
    throw new Error(
      "Trying to set up a new organization in an environment without emulator support"
    );
  }

  const organization = uuid();
  const email = `${organization}@eisbuk.it`;
  const pass = `password-${organization}`;

  const orgRef = db.doc(`${Collection.Organizations}/${organization}`);

  await Promise.all<any>([
    // Create a new user in auth
    createUserWithEmailAndPassword(auth, email, pass),
    // Set given user as admin in org structure
    orgRef.set({ admins: [email] }),
  ]);

  if (!doLogin) {
    await signOut(auth);
  }

  return { organization, email, pass };
};
// #endregion setUpOrganization

// #region getTestEnv
export type TestEnvFirestore = ReturnType<RulesTestContext["firestore"]>;
export type ExtendedTestEnvFirestore = TestEnvFirestore & {
  testEnv: RulesTestEnvironment;
};

interface TestParams extends TestOrganizationParams {
  db: ExtendedTestEnvFirestore;
}

export type TestEnvSetup = (
  input: TestEnvFirestore,
  orgSetup: TestOrganizationParams
) => Promise<any>;

interface GetTestEnv {
  (params: { setup?: TestEnvSetup; auth?: boolean }): Promise<TestParams>;
}

/**
 * Creates a test env using `firestore/rules-unit-testing` helpers
 * @param {Object} params
 * @param {Function} params.setup optional setup function. Used to set up firestore state
 * before the test. Gets ran with firstore rules disabled,
 * accepts `db` -> a "god mode" firestore instance
 * @param {boolean} params.auth authentication flag,
 * returns auth context for `true`, unauth for `false
 * @returns `db` reference for test environment along with organization namd and `user`, `pass` for the organizaton admin
 */
export const getTestEnv: GetTestEnv = async ({
  auth = true,
  setup = async () => {},
}) => {
  // create a unique project id for each test to run in pristine environment
  const projectId = "eisbuk";
  const testEnv = await initializeTestEnvironment({ projectId });
  let testOrganizationParams = {} as TestOrganizationParams;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    testOrganizationParams = await setUpOrganization(auth, db);
    // run setup function if any provided
    await setup(db, testOrganizationParams);
  });
  // return test context with respect to `auth`
  const db: ExtendedTestEnvFirestore = auth
    ? (testEnv
        .authenticatedContext(testOrganizationParams.email, {
          email: testOrganizationParams.email,
        })
        .firestore() as ExtendedTestEnvFirestore)
    : (testEnv
        .unauthenticatedContext()
        .firestore() as ExtendedTestEnvFirestore);

  db["testEnv"] = testEnv;

  return { ...testOrganizationParams, db };
};
// #region getTestEnv

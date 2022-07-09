import {
  RulesTestContext,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setDoc, doc } from "@firebase/firestore";

import { Collection } from "@eisbuk/shared";

import { getOrganization } from "../../utils/getters";

const defaultUser = { email: "eisbuk@eisbuk" };

/** @TEMP replace this with central init test env function */
export type TestEnvFirestore = ReturnType<RulesTestContext["firestore"]>;
export type TestEnvSetup = (db: TestEnvFirestore) => Promise<void>;

interface GetTestEnv {
  (setup?: TestEnvSetup): Promise<TestEnvFirestore>;
}

export const getAuthTestEnv: GetTestEnv = async (setup = async () => {}) => {
  // create a unique project id for each test to run in pristine environment
  const projectId = Date.now().toString().substring(8);
  const testEnv = await initializeTestEnvironment({ projectId });
  // we're generating an auth context using our `defaultUser`
  // in compliance with our `firestore.rules`, the `defaultUser` needs to be stored
  // as organization's admin in firestore for a complete `isAdmin` functionality
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, Collection.Organizations, getOrganization()), {
      admins: [defaultUser.email],
    });
    // run setup function if any provided
    await setup(db);
  });
  // return authenticated db
  return testEnv
    .authenticatedContext(defaultUser.email, { email: defaultUser.email })
    .firestore();
};

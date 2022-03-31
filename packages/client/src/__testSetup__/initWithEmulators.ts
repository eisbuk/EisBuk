/**
 * This script should run as a global test setup if the tests are running
 * in environment with emulators
 *
 * @Note We're always using relative paths here as this script runs before jest's module resolution
 * (for some reason) and paths using alias would not be resolved
 */
import { createUserWithEmailAndPassword } from "@firebase/auth";

import { Collection } from "@eisbuk/shared";

import { defaultUser, __testOrganization__ } from "./envData";
import { adminDb, auth } from "./firestoreSetup";

import { __withEmulators__ } from "../__testUtils__/envUtils";

/**
 * An test init script (part of global test setup) ran only in environment with firebase emulators.
 * The emulator check is ran within the function, so the function should be ran each time the `initTests`
 * script is ran.
 */
export const initTestsWithEmulators = async (): Promise<void> => {
  // exit early if no emulators
  if (!__withEmulators__) return;

  const testOrgRef = adminDb
    .collection(Collection.Organizations)
    .doc(__testOrganization__);

  // create a test organization and default admin if no exist
  const testOrgExists = (await testOrgRef.get()).exists;
  if (!testOrgExists) {
    console.log("Setting up test organization...");
    await createDefaultOrgAndAdmin();
  }
};

/**
 *
 */
export const createDefaultOrgAndAdmin = async (): Promise<void> => {
  // create a default user in emulators auth record if not already created
  try {
    await createUserWithEmailAndPassword(
      auth,
      defaultUser.email,
      defaultUser.password
    );
    console.log("Created a default user in emulators' auth record:");
    console.log(`Email: ${defaultUser.email}`);
    console.log(`Password: ${defaultUser.password}`);
    // eslint-disable-next-line no-empty
  } catch {}

  // add default user as admin in test organization (and create test organization)
  await adminDb
    .collection(Collection.Organizations)
    .doc(__testOrganization__)
    .set({
      admins: [defaultUser.email],
    });

  console.log("Created a default test organization");
};

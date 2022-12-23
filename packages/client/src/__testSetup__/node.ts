import { v4 as uuid } from "uuid";
import { createUserWithEmailAndPassword, signOut } from "@firebase/auth";

import { Collection, OrganizationData } from "@eisbuk/shared";

import { adminDb, auth } from "./firestoreSetup";

import { __withEmulators__ } from "@/__testUtils__/envUtils";
import { waitForCondition } from "@/__testUtils__/helpers";

interface SetUpOrganization {
  (options?: {
    doLogin?: boolean;
    setSecrets?: boolean;
    additionalSetup?: Partial<OrganizationData>;
  }): Promise<{
    organization: string;
    email: string;
    pass: string;
  }>;
}

export const smtpPort = 5000;
export const smtpHost = "localhost";

export const setUpOrganization: SetUpOrganization = async ({
  doLogin = true,
  setSecrets = true,
  additionalSetup = {},
} = {}) => {
  if (!__withEmulators__) {
    throw new Error(
      "Trying to set up a new organization in an environment without emulator support"
    );
  }
  const organization = uuid();
  const email = `${organization}@eisbuk.it`;
  const pass = `password-${organization}`;

  const orgRef = adminDb.doc(`${Collection.Organizations}/${organization}`);
  const secretsRef = adminDb.doc(`${Collection.Secrets}/${organization}`);

  const promises = [
    // Create a new user in auth
    createUserWithEmailAndPassword(auth, email, pass),
    // Set given user as admin in org structure
    orgRef.set({
      admins: [email],
      emailFrom: "emailFrom@gmail.com",
      ...additionalSetup,
    }),
  ];

  // Add secrets if so specified
  if (setSecrets) {
    promises.push(
      secretsRef.set({
        smtpHost,
        smtpPort,
        smtpUser: email,
        smtpPass: pass,
      })
    );
  }

  await Promise.all(promises);

  // If secrets should be set, wait for the data trigger to update the smtpConfigured flag.
  if (setSecrets) {
    await waitForCondition<OrganizationData>({
      documentPath: orgRef.path,
      condition: (data) => Boolean(data?.smtpConfigured),
    });
  }

  if (!doLogin) {
    await signOut(auth);
  }

  return { organization, email, pass };
};

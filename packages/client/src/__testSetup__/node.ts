import { v4 as uuid } from "uuid";
import { createUserWithEmailAndPassword, signOut } from "@firebase/auth";
import { smtpPort } from "./main";
import { Collection } from "@eisbuk/shared";

import { adminDb, auth } from "./firestoreSetup";

import { __withEmulators__ } from "@/__testUtils__/envUtils";

interface SetUpOrganization {
  (doLogin?: boolean): Promise<{
    organization: string;
    email: string;
    pass: string;
  }>;
}

export const setUpOrganization: SetUpOrganization = async (doLogin = true) => {
  if (!__withEmulators__) {
    throw new Error(
      "Trying to set up a new organization in an environment without emulator support"
    );
  }

  const organization = uuid();
  const email = `${organization}@eisbuk.it`;
  const pass = `password-${organization}`;
  const smtpHost = "localhost";

  const orgRef = adminDb.doc(`${Collection.Organizations}/${organization}`);
  const secretsRef = adminDb.doc(`${Collection.Secrets}/${organization}`);

  await Promise.all([
    // Create a new user in auth
    createUserWithEmailAndPassword(auth, email, pass),
    // Set given user as admin in org structure
    orgRef.set({
      admins: [email],
      fromEmail: "from@gmail.com",
      bcc: "bcc@gmail.com",
    }),
    secretsRef.set({
      smtpHost,
      smtpPort,
    }),
  ]);

  if (!doLogin) {
    await signOut(auth);
  }

  return { organization, email, pass };
};

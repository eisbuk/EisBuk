import { doc } from "@firebase/firestore";

import { Collection } from "eisbuk-shared";

import { adminDb, db } from "@/__testSetup__/firestoreSetup";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { loginWithEmail, loginWithPhone } from "@/__testUtils__/auth";
import { getDoc } from "firebase/firestore";

describe("Test authentication", () => {
  describe("Test organization data access", () => {
    testWithEmulator(
      "should only let admin access the organization data (by email)",
      async () => {
        const orgDefinition = {
          admins: ["test@example.com"],
        };
        await adminDb
          .collection(Collection.Organizations)
          .doc("default")
          .set(orgDefinition);
        // We haven't logged in yet, so we won't be authorized access
        const defaultOrgDoc = doc(db, Collection.Organizations, "default");
        let error;
        try {
          (await getDoc(defaultOrgDoc)).data();
        } catch (e) {
          error = true;
        }
        expect(error).toBe(true);

        // After login we'll be able to read and write documents in our organization
        await loginWithEmail("test@example.com");
        const org = (await getDoc(defaultOrgDoc)).data();
        expect(org).toEqual(orgDefinition);
      }
    );

    /** @TODO phone login doesn't work in node enviroment, investigate or test with cypress */
    xtest("let admin access an organization data (by phone)", async () => {
      const orgDefinition = {
        admins: ["+1234567890"],
      };
      await adminDb
        .collection(Collection.Organizations)
        .doc("withPhone")
        .set(orgDefinition);

      await loginWithPhone(orgDefinition.admins[0]);
      // After login we'll be able to read and write documents in our organization
      const org = (
        await adminDb
          .collection(Collection.Organizations)
          .doc("withPhone")
          .get()
      ).data();
      expect(org).toStrictEqual(orgDefinition);
    });
  });
});

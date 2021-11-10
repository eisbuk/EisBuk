import { Collection } from "eisbuk-shared";

import { db, adminDb } from "@/__testSettings__";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { loginWithEmail, loginWithPhone } from "@/__testUtils__/auth";

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
        const defaultOrgDoc = db
          .collection(Collection.Organizations)
          .doc("default");
        let error;
        try {
          (await defaultOrgDoc.get()).data();
        } catch (e) {
          error = true;
        }
        expect(error).toBe(true);

        // After login we'll be able to read and write documents in our organization
        await loginWithEmail("test@example.com");
        const org = (await defaultOrgDoc.get()).data();
        expect(org).toStrictEqual(orgDefinition);
      }
    );

    testWithEmulator(
      "let admin access an organization data (by phone)",
      async () => {
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
          await db.collection(Collection.Organizations).doc("withPhone").get()
        ).data();
        expect(org).toStrictEqual(orgDefinition);
      }
    );
  });
});

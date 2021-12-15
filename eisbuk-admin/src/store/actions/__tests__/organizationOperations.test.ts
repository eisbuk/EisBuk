import { Collection, OrgMailConfig } from "eisbuk-shared";

import { getOrganization } from "@/lib/getters";

import { updateMailConfig } from "../organizationOperations";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { loginDefaultUser } from "@/__testUtils__/auth";
import { deleteAll } from "@/__testUtils__/firestore";

import { defaultUser } from "@/__testSetup__/envData";
import { adminDb } from "@/__testSetup__/firestoreSetup";

describe("Organization data operations", () => {
  beforeEach(async () => {
    await deleteAll();
    await loginDefaultUser();
  });

  describe("updateMailConfig", () => {
    testWithEmulator(
      "should update organization entry in firestore with provided email config",
      async () => {
        const dispatch = jest.fn();
        const getState = jest.fn();
        const orgDb = adminDb
          .collection(Collection.Organizations)
          .doc(getOrganization());
        // create and run the thunk
        const mailConfig: OrgMailConfig = {
          config: {
            host: "smtp.eisbuk.org",
            port: 2500,
            auth: { user: defaultUser.email, pass: defaultUser.password },
          },
          template: {
            from: "eisbuk-team@eisbuk.org",
            subject: "EisBuk booking access link",
          },
        };
        const testThunk = updateMailConfig(mailConfig);
        await testThunk(dispatch, getState);
        // check results
        const updatedOrg = await orgDb.get();
        expect(updatedOrg.data()).toEqual({
          admins: [defaultUser.email],
          mailConfig,
        });
      }
    );
  });
});

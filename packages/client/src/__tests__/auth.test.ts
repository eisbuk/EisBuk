/**
 * @vitest-environment node
 */

import { afterEach, describe, expect } from "vitest";
import {
  httpsCallable,
  HttpsCallableResult,
  FunctionsError,
} from "@firebase/functions";

import { AuthStatus, HTTPSErrors } from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";

import { adminDb, auth, functions } from "@/__testSetup__/firestoreSetup";

import { getCustomerDocPath } from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { saul } from "@eisbuk/testing/customers";
import { setUpOrganization } from "@/__testSetup__/node";
import { signInEmail } from "@/__testUtils__/auth";

describe("Test authentication", () => {
  afterEach(() => {
    auth.signOut();
  });

  describe("Test queryAuthStatus", () => {
    const queryAuthStatus = (organization: string) =>
      httpsCallable(
        functions,
        CloudFunction.QueryAuthStatus
      )({ organization }) as Promise<HttpsCallableResult<AuthStatus>>;

    testWithEmulator(
      "single secretKey: should successfully query customer status using email",
      async () => {
        // set up test state with saul as customer, but not an admin
        const { organization } = await setUpOrganization();
        await Promise.all([
          adminDb.doc(getCustomerDocPath(organization, saul.id)).set(saul),
          // The auth string (email in this case) is read from the auth object in function context.
          // Hence, the login.
          signInEmail(auth, saul.email!, "password"),
        ]);
        const {
          data: { isAdmin, secretKeys },
        } = await queryAuthStatus(organization);
        expect(isAdmin).toEqual(false);
        expect(secretKeys).toEqual([saul.secretKey]);
      }
    );

    testWithEmulator(
      "multiple secretKeys: should return secretKeys for all customers with matching email",
      async () => {
        // set up test state with saul as customer, but not an admin
        const { organization } = await setUpOrganization();
        const jimmy = {
          ...saul,
          id: "jimmy",
          secretKey: "jimmy-secret",
        };
        await Promise.all([
          adminDb.doc(getCustomerDocPath(organization, jimmy.id)).set(jimmy),
          adminDb.doc(getCustomerDocPath(organization, saul.id)).set(saul),
          // The auth string (email in this case) is read from the auth object in function context.
          // Hence, the login (creating a user automatically loggs in).
          signInEmail(auth, saul.email!, "password"),
        ]);
        const {
          data: { isAdmin, secretKeys },
        } = await queryAuthStatus(organization);
        expect(isAdmin).toEqual(false);
        expect(secretKeys).toEqual([jimmy.secretKey, saul.secretKey]);
      }
    );

    // Note: There are no tests for phone as it's hard to test authentication with phone (due to recaptcha requirements)
    // The desired behaviour, however, is tested using e2e tests (with full browser support).

    testWithEmulator(
      "should reject if no 'organization' provided",
      async () => {
        try {
          await httpsCallable(functions, CloudFunction.QueryAuthStatus)({});
        } catch (error) {
          expect((error as FunctionsError).message).toEqual(
            `${HTTPSErrors.MissingParameter}: organization`
          );
        }
      }
    );
  });
});

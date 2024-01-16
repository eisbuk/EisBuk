/**
 * @vitest-environment node
 */

import { describe, expect } from "vitest";
import {
  httpsCallable,
  HttpsCallableResult,
  FunctionsError,
} from "@firebase/functions";

import { Collection, AuthStatus, HTTPSErrors } from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";

import { adminDb, functions } from "@/__testSetup__/firestoreSetup";

import { getCustomerDocPath } from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { saul } from "@eisbuk/testing/customers";
import { setUpOrganization } from "@/__testSetup__/node";

describe("Test authentication", () => {
  describe("Test queryAuthStatus", () => {
    const queryAuthStatus = (organization: string, authString: string) =>
      httpsCallable(
        functions,
        CloudFunction.QueryAuthStatus
      )({ organization, authString }) as Promise<
        HttpsCallableResult<AuthStatus>
      >;

    testWithEmulator(
      "should successfully query admin status using email",
      async () => {
        // set up test state with saul as admin
        const { organization } = await setUpOrganization();
        await adminDb
          .doc([Collection.Organizations, organization].join("/"))
          .set({ admins: [saul.email] }, { merge: true });
        const res = await queryAuthStatus(organization, saul.email!);
        const {
          data: { isAdmin },
        } = res;
        expect(isAdmin).toEqual(true);
      }
    );

    testWithEmulator(
      "single secretKey: should successfully query customer status using email",
      async () => {
        // set up test state with saul as customer, but not an admin
        const { organization } = await setUpOrganization();
        await adminDb.doc(getCustomerDocPath(organization, saul.id)).set(saul);
        const {
          data: { isAdmin, secretKeys },
        } = await queryAuthStatus(organization, saul.email!);
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
        ]);
        const {
          data: { isAdmin, secretKeys },
        } = await queryAuthStatus(organization, saul.email!);
        expect(isAdmin).toEqual(false);
        expect(secretKeys).toEqual([jimmy.secretKey, saul.secretKey]);
      }
    );

    testWithEmulator(
      "single secretKey: should successfully query customer status using phone",
      async () => {
        // set up test state with saul as customer, but not an admin
        const { organization } = await setUpOrganization();
        await adminDb.doc(getCustomerDocPath(organization, saul.id)).set(saul);
        const {
          data: { isAdmin, secretKeys },
        } = await queryAuthStatus(organization, saul.phone!);
        expect(isAdmin).toEqual(false);
        expect(secretKeys).toEqual([saul.secretKey]);
      }
    );

    testWithEmulator(
      "multiple secretKeys: should return secretKeys for all customers with matching phone number",
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
        ]);
        const {
          data: { isAdmin, secretKeys },
        } = await queryAuthStatus(organization, saul.phone!);
        expect(isAdmin).toEqual(false);
        expect(secretKeys).toEqual([jimmy.secretKey, saul.secretKey]);
      }
    );

    testWithEmulator(
      "should reject if no 'organization' or 'authString' provided",
      async () => {
        try {
          await httpsCallable(functions, CloudFunction.QueryAuthStatus)({});
        } catch (error) {
          expect((error as FunctionsError).message).toEqual(
            `${HTTPSErrors.MissingParameter}: organization, authString`
          );
        }
      }
    );
  });
});

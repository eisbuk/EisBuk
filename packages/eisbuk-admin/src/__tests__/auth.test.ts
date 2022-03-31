/**
 * @jest-environment node
 */

import { doc, getDoc } from "@firebase/firestore";
import {
  httpsCallable,
  HttpsCallableResult,
  FunctionsError,
} from "@firebase/functions";

import {
  Collection,
  AuthStatus,
  OrgSubCollection,
  HTTPSErrors,
} from "eisbuk-shared";

import { adminDb, db, functions } from "@/__testSetup__/firestoreSetup";

import { CloudFunction } from "@/enums/functions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { loginWithEmail, loginWithPhone } from "@/__testUtils__/auth";
import { deleteCollection } from "@/__testUtils__/firestore";

import { saul } from "@/__testData__/customers";

const organization = "auth-test-organization";
const orgRef = adminDb.collection(Collection.Organizations).doc(organization);
const customersRef = orgRef.collection(OrgSubCollection.Customers);

describe("Test authentication", () => {
  afterEach(async () => {
    await Promise.all([deleteCollection(customersRef), orgRef.delete()]);
  });

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

  describe.only("Test queryAuthStatus", () => {
    const queryAuthStatus = (authString: string) =>
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
        await orgRef.set({ admins: [saul.email] }, { merge: true });
        const res = await queryAuthStatus(saul.email!);
        const {
          data: { isAdmin },
        } = res;
        expect(isAdmin).toEqual(true);
      }
    );

    testWithEmulator(
      "should successfully query customer status using email",
      async () => {
        // set up test state with saul as customer, but not an admin
        await customersRef.doc(saul.id).set(saul);
        const {
          data: { isAdmin, bookingsSecretKey },
        } = await queryAuthStatus(saul.email!);
        expect(isAdmin).toEqual(false);
        expect(bookingsSecretKey).toEqual(saul.secretKey);
      }
    );

    testWithEmulator(
      "should successfully query customer status using phone",
      async () => {
        // set up test state with saul as customer, but not an admin
        await customersRef.doc(saul.id).set(saul);
        const {
          data: { isAdmin, bookingsSecretKey },
        } = await queryAuthStatus(saul.phone!);
        expect(isAdmin).toEqual(false);
        expect(bookingsSecretKey).toEqual(saul.secretKey);
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

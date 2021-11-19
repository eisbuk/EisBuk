import { setDoc, doc } from "@firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "@firebase/auth";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { __organization__ } from "@/lib/constants";

import { ActionButton } from "@/enums/translations";

import { defaultUser } from "@/__testSetup__/envData";
import { adminDb, auth, db } from "@/__testSetup__/firestoreSetup";

import i18n from "@/__testUtils__/i18n";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { loginDefaultUser } from "@/__testUtils__/auth";

import { saul } from "@/__testData__/customers";

describe("Smoke test", () => {
  afterEach(() => {
    signOut(auth);
  });

  describe("Test i18n setup", () => {
    test("should initialize i18n with the tests", () => {
      // i18n should be initialized in imported `@/__testUtils__/i18n`
      const translatedString = i18n.t(ActionButton.Cancel);
      expect(translatedString).toEqual("Cancel");
    });
  });

  describe("Test emulators setup and utils", () => {
    testWithEmulator("should create a default organization", async () => {
      const testOrgRef = adminDb
        .collection(Collection.Organizations)
        .doc(__organization__);
      const testOrgCreated = (await testOrgRef.get()).exists;
      expect(testOrgCreated).toEqual(true);
    });

    testWithEmulator(
      "a default user should be created in test global setup",
      async () => {
        const {
          user: { uid },
        } = await signInWithEmailAndPassword(
          auth,
          defaultUser.email,
          defaultUser.password
        );
        expect(uid).toBeTruthy();
      }
    );

    testWithEmulator(
      "should allow access after signIn as default user",
      async () => {
        const saulDocRef = doc(
          db,
          `${Collection.Organizations}/${__organization__}/${OrgSubCollection.Customers}/${saul.id}`
        );

        // should not allow access to customers before authentication
        let accessErr = false;
        try {
          await setDoc(saulDocRef, saul);
        } catch {
          accessErr = true;
        }
        expect(accessErr).toEqual(true);

        // should allow access after default user login
        await loginDefaultUser();
        await setDoc(saulDocRef, saul);
      }
    );
  });
});

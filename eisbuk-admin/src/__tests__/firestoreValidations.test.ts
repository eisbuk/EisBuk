import { doc, setDoc } from "@firebase/firestore";

import { db } from "@/__testSetup__/firestoreSetup";

import { __organization__ } from "@/lib/constants";

import { adminDb } from "@/__testSettings__";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { deleteAll } from "@/__testUtils__/firestore";
import { loginDefaultUser } from "@/__testUtils__/auth";
import { testWithEmulator } from "@/__testUtils__/envUtils";

import { baseSlot } from "@/__testData__/slots";

describe("Firestore data validations", () => {
  beforeEach(async () => {
    await deleteAll();
    await loginDefaultUser();
  });

  describe("Test date ISO validations", () => {
    testWithEmulator(
      "should not allow write if slot date is not a valid ISO date",
      async () => {
        const docRef = doc(
          db,
          `${Collection.Organizations}/${__organization__}/${OrgSubCollection.Slots}/test-slot`
        );
        // write a valid slot (to assure we have the permissions)
        await setDoc(docRef, baseSlot);
        // test out with invalid slot
        await expect(
          setDoc(docRef, { ...baseSlot, date: "not-a-valid-iso-string" })
        ).rejects.toThrow();
      }
    );
  });
});

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { adminDb } from "@/tests/settings";
import { ORGANIZATION } from "@/config/envInfo";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { deleteAll } from "@/tests/utils";

import { baseSlot } from "@/__testData__/slots";

xdescribe("Firestore data validations", () => {
  afterEach(async () => {
    await deleteAll([OrgSubCollection.Slots]);
  });

  describe("Test date ISO validations", () => {
    testWithEmulator(
      "should not allow write if slot date is not a valid ISO date",
      async () => {
        const slotRef = adminDb
          .collection(Collection.Organizations)
          .doc(ORGANIZATION)
          .collection(OrgSubCollection.Slots)
          .doc("test-slot");

        await slotRef.set({ ...baseSlot, date: "not-a-valid-iso-string" });
        const res = (await slotRef.get()).data();
        console.log(JSON.stringify(res, null, 2));
        throw new Error();
      }
    );
  });
});

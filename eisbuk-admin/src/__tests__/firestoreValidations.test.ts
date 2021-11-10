import { testWithEmulator } from "@/__testUtils__/envUtils";

import { getOrganization } from "@/config/envInfo";
import { adminDb } from "@/__testSettings__";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { deleteAll } from "@/__testUtils__/firestore";

import { baseSlot } from "@/__testData__/slots";

xdescribe("Firestore data validations", () => {
  beforeEach(async () => {
    await deleteAll();
  });

  describe("Test date ISO validations", () => {
    testWithEmulator(
      "should not allow write if slot date is not a valid ISO date",
      async () => {
        const slotRef = adminDb
          .collection(Collection.Organizations)
          .doc(getOrganization())
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

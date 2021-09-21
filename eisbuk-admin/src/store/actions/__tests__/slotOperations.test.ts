import { adminDb } from "@/tests/settings";
import { ORGANIZATION } from "@/config/envInfo";

import { createNewSlot } from "../slotOperations";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestSlots } from "../__testUtils__/firestore";

import { initialSlots, testFromValues } from "../__testData__/slotOperations";
import { Collection, OrgSubCollection } from "eisbuk-shared/dist";

describe("Slot operations", () => {
  describe("'createSlot'", () => {
    testWithEmulator(
      "should create a new slot (with generated uuid) in firestore",
      async () => {
        // set up test state
        const thunkArgs = await setupTestSlots(initialSlots);
        // create curried thunk
        const thunk = createNewSlot(testFromValues);
        // dispatch curried thunk against emulated firestore
        await thunk(...thunkArgs);
        // get updated firestore state
        const slotsInFS = await adminDb
          .collection(Collection.Organizations)
          .doc(ORGANIZATION)
          .collection(OrgSubCollection.Slots)
          .get();
        const slots = JSON.stringify(slotsInFS, null, 2);
        console.log(slots);
        throw new Error();
      }
    );
  });
});

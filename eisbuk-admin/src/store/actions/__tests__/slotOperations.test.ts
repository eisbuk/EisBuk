import {
  Category,
  Collection,
  OrgSubCollection,
  SlotType,
} from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";

import { createNewSlot, deleteSlot, updateSlot } from "../slotOperations";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { getFirebase } from "@/__testUtils__/firestore";
import { setupTestSlots } from "../__testUtils__/firestore";

import {
  initialSlotIds,
  initialSlots,
  testFromValues,
  testSlot,
} from "../__testData__/slotOperations";
import { deleteAll } from "@/tests/utils";

const db = getFirebase().firestore();

// path of attendance collection and test month document to make our lives easier
// as we'll be using it throughout
const slotsRef = db
  .collection(Collection.Organizations)
  .doc(ORGANIZATION)
  .collection(OrgSubCollection.Slots);

describe("Slot operations ->", () => {
  afterEach(async () => {
    await Promise.all([deleteAll([OrgSubCollection.Slots])]);
  });

  describe("createSlot ->", () => {
    testWithEmulator(
      "should add new slot to firestore (with generated uuid)",
      async () => {
        // set up initial state
        const thunkArgs = await setupTestSlots({ slots: initialSlots });
        // create a thunk curried with test input values
        const testThunk = createNewSlot(testFromValues);
        await testThunk(...thunkArgs);
        const slotsInFS = (await slotsRef.get()).docs;
        // check that the new slot was created
        expect(slotsInFS.length).toEqual(3);
        // since we're not setting the id manually, we're finding our test slot by filtering out initial slot ids
        const testSlotInFS = slotsInFS
          .find((slot) => !initialSlotIds.includes(slot.data().id))
          ?.data() || { id: "fail" };
        // check that new slot contains proper data
        expect(testSlotInFS).toEqual({
          ...testSlot,
          id: testSlotInFS.id,
        });
      }
    );
  });

  describe("editSlot ->", () => {
    testWithEmulator("should edit an existing slot in firestore", async () => {
      const slotId = "test-slot";
      // set up initial state
      const thunkArgs = await setupTestSlots({
        slots: {
          ...initialSlots,
          [slotId]: { ...testSlot, id: slotId },
        },
      });
      // updates we're applying to slot
      const updates = {
        categories: Object.values(Category),
        type: SlotType.OffIceDancing,
        intervals: [
          {
            startTime: "09:00",
            endTime: "10:00",
          },
        ],
      };
      // create a thunk curried with updated form values
      const testThunk = updateSlot({
        ...testFromValues,
        ...updates,
        id: slotId,
      });
      await testThunk(...thunkArgs);
      // check that the slot is properly updated
      const testSlotInFS = (await slotsRef.doc(slotId).get()).data();
      expect(testSlotInFS).toEqual({
        ...testSlot,
        id: slotId,
        ...updates,
        intervals: {
          ["09:00-10:00"]: updates.intervals[0],
        },
      });
    });
  });

  describe("deleteSlot ->", () => {
    testWithEmulator("should edit an existing slot in firestore", async () => {
      const slotId = "test-slot";
      // set up initial state
      const thunkArgs = await setupTestSlots({
        slots: {
          ...initialSlots,
          [slotId]: { ...testSlot, id: slotId },
        },
      });
      // create a thunk curried with slot id
      const testThunk = deleteSlot(slotId);
      await testThunk(...thunkArgs);
      // check that the slot was deleted from db
      const slotsInFS = (await slotsRef.get()).docs;
      expect(slotsInFS.length).toEqual(2);
    });
  });
});

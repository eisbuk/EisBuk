import { Collection, OrgSubCollection } from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";

import {
  copySlotsDay,
  copySlotsWeek,
  pasteSlotsDay,
  pasteSlotsWeek,
  setSlotDayToClipboard,
  setSlotWeekToClipboard,
} from "../copyPaste";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupCopyPaste, setupTestSlots } from "../__testUtils__/firestore";

import {
  expectedWeek,
  testDay,
  testSlots,
  testWeek,
} from "../__testData__/copyPaste";
import { testDateLuxon } from "@/__testData__/date";
import { deleteAll } from "@/tests/utils";
import { getFirebase } from "@/__testUtils__/firestore";

/**
 * Mock dispatch function we're feeding to our thunk testing function (`setUpTestSlots`)
 */
const mockDispatch = jest.fn();

describe("Copy Paste actions", () => {
  afterEach(async () => {
    jest.clearAllMocks();
    await deleteAll([OrgSubCollection.Slots, OrgSubCollection.SlotsByDay]);
  });

  describe("copySlotsDay", () => {
    testWithEmulator(
      "should dispatch 'setSlotDayToClipboard' with appropriate slots",
      async () => {
        // set up test state
        const thunkArgs = await setupTestSlots({
          slots: testSlots,
          dispatch: mockDispatch,
        });
        // create a thunk curried with `date`
        const testThunk = copySlotsDay(testDateLuxon);
        // run the thunk against a store
        await testThunk(...thunkArgs);
        // test that slots have been added to clipboard
        expect(mockDispatch).toHaveBeenCalledWith(
          setSlotDayToClipboard(testDay)
        );
      }
    );
  });

  describe("copySlotsWeek", () => {
    testWithEmulator(
      "should dispatch 'setSlotDayToClipboard' with appropriate slots",
      async () => {
        // set up test state
        const thunkArgs = await setupTestSlots({
          slots: testSlots,
          dispatch: mockDispatch,
        });
        // create a thunk (no need for date as it's read from the store)
        const testThunk = copySlotsWeek();
        // run the thunk against a store
        await testThunk(...thunkArgs);
        // test that slots have been added to clipboard
        expect(mockDispatch).toHaveBeenCalledWith(
          setSlotWeekToClipboard(expectedWeek)
        );
      }
    );
  });

  const db = getFirebase().firestore();
  const slotsRef = db
    .collection(Collection.Organizations)
    .doc(ORGANIZATION)
    .collection(OrgSubCollection.Slots);

  describe("pasteSlotsDay", () => {
    testWithEmulator(
      "should update firestore with slots day from clipboard pasted to new day (with new slots having uuid generated ids and without messing up the new day)",
      async () => {
        // set up test state
        const thunkArgs = await setupCopyPaste({
          day: testDay,
          dispatch: mockDispatch,
        });
        // we're pasting to wednesday of test week
        const newDate = testDateLuxon.plus({ days: 2 });
        // create paste thunk curried with `newDate`
        const pasteThunk = pasteSlotsDay(newDate);
        await pasteThunk(...thunkArgs);
        const updatedSlots = await slotsRef.get();
        updatedSlots.forEach((slot) => {
          // we're expecting the same data as base slot (as base slot was copied) but with updated date
          const slotDate = slot.data().date;
          expect(slotDate).toEqual({
            seconds: newDate.toSeconds(),
          });
        });
      }
    );
  });

  describe("pasteSlotsWeek", () => {
    testWithEmulator(
      "should dispatch 'setSlotDayToClipboard' with appropriate slots",
      async () => {
        // set up test state
        const thunkArgs = await setupCopyPaste({
          week: { slots: Object.values(testWeek), weekStart: testDateLuxon },
          dispatch: mockDispatch,
        });
        // create a thunk with next week as week to paste to
        const newDate = testDateLuxon.plus({ weeks: 1 });
        const testThunk = pasteSlotsWeek(newDate);
        // run the thunk against a store
        await testThunk(...thunkArgs);
        // test that slots have been updated
        const updatedSlots = await slotsRef.get();
        // process dates for comparison
        const updatedDates = updatedSlots.docs
          .map((doc) => doc.data().date)
          .sort((a, b) => a.seconds - b.seconds);
        const slotsDates = Object.values(testWeek)
          .map(({ date: { seconds } }) => ({
            // we're moving each date up one week before sorting (to test slots being moved one week up)
            seconds: seconds + 3600 * 24 * 7,
          }))
          .sort((a, b) => a.seconds - b.seconds);
        // if sorted dates match, the update was successful
        expect(updatedDates).toEqual(slotsDates);
      }
    );
  });
});

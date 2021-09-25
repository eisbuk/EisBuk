import {
  copySlotsDay,
  copySlotsWeek,
  setSlotDayToClipboard,
  setSlotWeekToClipboard,
} from "../copyPaste";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestSlots } from "../__testUtils__/firestore";

import { expectedWeek, testDay, testSlots } from "../__testData__/copyPaste";
import { testDateLuxon } from "@/__testData__/date";

/**
 * Mock dispatch function we're feeding to our thunk testing function (`setUpTestSlots`)
 */
const mockDispatch = jest.fn();

describe("Copy Paste actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("copySlotsDay", () => {
    testWithEmulator(
      "should dispatch 'setSlotDayToClipboard' with appropriate slots",
      async () => {
        // set up test state
        const thunkArgs = await setupTestSlots({
          slots: testSlots,
          mockDispatch,
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
          mockDispatch,
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
});

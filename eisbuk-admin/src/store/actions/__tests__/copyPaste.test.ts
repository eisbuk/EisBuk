import * as firestore from "@firebase/firestore";

import {
  Collection,
  OrgSubCollection,
  SlotsByDay,
  SlotsById,
} from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";

import {
  copySlotsDay,
  copySlotsWeek,
  pasteSlotsDay,
  pasteSlotsWeek,
  setSlotDayToClipboard,
  setSlotWeekToClipboard,
} from "../copyPaste";
import * as appActions from "@/store/actions/appActions";

import { luxon2ISODate, luxonToFB } from "@/utils/date";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deleteAll } from "@/tests/utils";
import { waitForCondition } from "@/__testUtils__/helpers";
import { setupCopyPaste, setupTestSlots } from "../__testUtils__/firestore";

import { testDate, testDateLuxon } from "@/__testData__/date";
import {
  expectedWeek,
  testDay,
  testSlots,
  testWeek,
} from "../__testData__/copyPaste";
import { baseSlot } from "@/__testData__/dummyData";
/**
 * Mock dispatch function we're feeding to our thunk testing function (`setUpTestSlots`)
 */
const mockDispatch = jest.fn();

/**
 * Spy function we're using to occasionally cause errors on purpose
 * to test error handling
 */
const getFirebaseSpy = jest.spyOn(firestore, "getFirestore");

// mocked return value for `enqueueErrSnackbar`.
// the actual return value is the thunk, but we're using this to easily test dispatching
const errNotifAction = { type: "err_spy" };
jest
  .spyOn(appActions, "showErrSnackbar")
  .mockImplementation(() => errNotifAction as any);

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

  const db = firestore.getFirestore();
  const slotsCollectionPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Slots}`;

  const monthStr = testDate.substr(0, 7);
  const slotsByIdPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.SlotsByDay}/${monthStr}`;

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
        const newDateISO = luxon2ISODate(newDate);
        // create paste thunk curried with `newDate`
        const pasteThunk = pasteSlotsDay(newDate);
        await pasteThunk(...thunkArgs);
        const numSlotsToPaste = Object.keys(testDay).length;
        // wait for slot aggregation
        const updatedSlotsMonth = (await waitForCondition({
          documentPath: slotsByIdPath,
          condition: (data) => {
            // exit early if no data found
            if (!data) return false;
            const newDateSlots = data[newDateISO] || ({} as SlotsById);
            const numSlotsPasted = Object.keys(newDateSlots).length;
            // we're testing if two new slots are added to new day (as we've copied two slots from test day)
            return numSlotsPasted === numSlotsToPaste;
          },
        })) as SlotsByDay;
        // check new slots
        const updatedSlotDay = updatedSlotsMonth[newDateISO];
        Object.keys(updatedSlotDay).forEach((slotId) => {
          // we're expecting the same data as base slot (as base slot was copied)
          // but with updated date and id
          expect(updatedSlotDay[slotId]).toEqual({
            ...baseSlot,
            id: slotId,
            date: luxonToFB(newDate),
          });
        });
      }
    );

    testWithEmulator("should display error message on fail", async () => {
      // intentionally cause error
      getFirebaseSpy.mockImplementationOnce(() => {
        throw new Error();
      });
      // run the thunk
      const thunkArgs = await setupCopyPaste({
        day: testDay,
        dispatch: mockDispatch,
      });
      const pasteThunk = pasteSlotsDay(testDateLuxon);
      await pasteThunk(...thunkArgs);
      // check the error message being enqueued
      expect(mockDispatch).toHaveBeenCalledWith(errNotifAction);
    });
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
        const slotsCollRef = firestore.collection(db, slotsCollectionPath);
        const updatedSlots = await firestore.getDocs(slotsCollRef);
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

    testWithEmulator(
      "should dispatch 'setSlotDayToClipboard' with appropriate slots",
      async () => {
        // intentionally cause error
        getFirebaseSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run the thunk
        const thunkArgs = await setupCopyPaste({
          week: { slots: Object.values(testWeek), weekStart: testDateLuxon },
          dispatch: mockDispatch,
        });
        const testThunk = pasteSlotsWeek(testDateLuxon);
        await testThunk(...thunkArgs);
        // check the error message being enqueued
        expect(mockDispatch).toHaveBeenCalledWith(errNotifAction);
      }
    );
  });
});

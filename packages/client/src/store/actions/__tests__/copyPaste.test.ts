/**
 * @jest-environment node
 */

import * as firestore from "@firebase/firestore";
import { collection, getDocs } from "@firebase/firestore";

import {
  Collection,
  OrgSubCollection,
  fromISO,
  luxon2ISODate,
} from "@eisbuk/shared";

import { getNewStore } from "@/store/createStore";

import { getTestEnv } from "@/__testSetup__/getTestEnv";

import { getOrganization } from "@/lib/getters";

import {
  copySlotsDay,
  copySlotsWeek,
  pasteSlotsDay,
  pasteSlotsWeek,
  setSlotDayToClipboard,
  setSlotWeekToClipboard,
} from "../copyPaste";
import { showErrSnackbar } from "@/store/actions/appActions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupCopyPaste, setupTestSlots } from "../__testUtils__/firestore";
import { loginDefaultUser } from "@/__testUtils__/auth";

import { testDateLuxon } from "@/__testData__/date";
import {
  expectedWeek,
  testDay,
  testSlots,
  testWeek,
} from "../__testData__/copyPaste";

/**
 * Mock dispatch function we're feeding to our thunk testing function (`setUpTestSlots`)
 */
const mockDispatch = jest.fn();

/**
 * Spy function we're using to occasionally cause errors on purpose
 * to test error handling
 */
const getFirestoreSpy = jest.spyOn(firestore, "getFirestore");

describe("Copy Paste actions", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await loginDefaultUser();
  });

  describe("copySlotsDay", () => {
    testWithEmulator(
      "should dispatch 'setSlotDayToClipboard' with appropriate slots",
      async () => {
        // set up test state
        const store = getNewStore();
        const db = await getTestEnv({
          setup: (db) =>
            setupTestSlots({
              slots: testSlots,
              db,
              store,
            }),
        });
        // make sure the tests use the test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk against a store
        await copySlotsDay(testDateLuxon)(mockDispatch, store.getState);
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
        const store = getNewStore();
        const db = await getTestEnv({
          setup: (db) =>
            setupTestSlots({
              slots: testSlots,
              db,
              store,
            }),
        });
        // make sure the tests use the test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk against a store
        await copySlotsWeek()(mockDispatch, store.getState);
        // test that slots have been added to clipboard
        expect(mockDispatch).toHaveBeenCalledWith(
          setSlotWeekToClipboard(expectedWeek)
        );
      }
    );
  });

  const slotsPath = `${Collection.Organizations}/${getOrganization()}/${
    OrgSubCollection.Slots
  }`;

  describe("pasteSlotsDay", () => {
    testWithEmulator(
      "should update firestore with slots day from clipboard pasted to new day (with new slots having uuid generated ids and without messing up the new day)",
      async () => {
        // set up test state
        const store = getNewStore();
        const db = await getTestEnv({
          setup: (db) =>
            setupCopyPaste({
              day: testDay,
              store,
              db,
            }),
        });
        // make sure the tests use the test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // we're pasting to wednesday of test week
        const newDate = testDateLuxon.plus({ days: 2 });
        const newDateISO = luxon2ISODate(newDate);
        // run the thunk against the store
        await pasteSlotsDay(newDate)(mockDispatch, store.getState);
        const numSlotsToPaste = Object.keys(testDay).length;
        // check updated slots in db
        await db.testEnv.withSecurityRulesDisabled(async (context) => {
          const slotsInStore = await getDocs(
            collection(context.firestore(), slotsPath)
          );
          expect(slotsInStore.docs.length).toEqual(numSlotsToPaste);
          slotsInStore.forEach((slot) => {
            const data = slot.data();
            expect(data.date).toEqual(newDateISO);
          });
        });
      }
    );

    testWithEmulator("should display error message on fail", async () => {
      // intentionally cause error
      getFirestoreSpy.mockImplementationOnce(() => {
        throw new Error();
      });
      // run the faulty thunk
      await pasteSlotsDay(testDateLuxon)(mockDispatch, () => ({} as any));
      // check the error message being enqueued
      expect(mockDispatch).toHaveBeenCalledWith(showErrSnackbar);
    });
  });

  describe("pasteSlotsWeek", () => {
    testWithEmulator(
      "should dispatch 'setSlotDayToClipboard' with appropriate slots",
      async () => {
        // set up test state
        const store = getNewStore();
        const db = await getTestEnv({
          setup: (db) =>
            setupCopyPaste({
              week: {
                slots: Object.values(testWeek),
                weekStart: testDateLuxon,
              },
              store,
              db,
            }),
        });
        // make sure the tests use the test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk with next week as week to paste to
        const newDate = testDateLuxon.plus({ weeks: 1 });
        await pasteSlotsWeek(newDate)(mockDispatch, store.getState);
        // test that slots have been updated
        const slotsCollRef = firestore.collection(db, slotsPath);
        const updatedSlots = await firestore.getDocs(slotsCollRef);
        // process dates for comparison
        const updatedDates = updatedSlots.docs
          .map((doc) => doc.data().date)
          .sort((a, b) => (a < b ? -1 : 1));
        const slotsDates = Object.values(testWeek)
          .map(({ date }) => {
            const newDate = fromISO(date).plus({ weeks: 1 });
            return luxon2ISODate(newDate);
          })
          .sort((a, b) => (a < b ? -1 : 1));
        // if sorted dates match, the update was successful
        expect(updatedDates).toEqual(slotsDates);
      }
    );

    testWithEmulator(
      "should show error message on unsuccessful update operation",
      async () => {
        // intentionally cause error
        getFirestoreSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run the failing thunk
        await pasteSlotsWeek(testDateLuxon)(mockDispatch, () => ({} as any));
        // check the error message being enqueued
        expect(mockDispatch).toHaveBeenCalledWith(showErrSnackbar);
      }
    );
  });
});

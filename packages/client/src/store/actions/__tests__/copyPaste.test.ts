/**
 * @jest-environment node
 */

import * as firestore from "@firebase/firestore";
import { collection, getDocs } from "@firebase/firestore";
import { DateTime } from "luxon";

import { fromISO, luxon2ISODate } from "@eisbuk/shared";

import * as getters from "@/lib/getters";

import { getNewStore } from "@/store/createStore";

import { getTestEnv } from "@/__testSetup__/firestore";

import {
  copySlotsDay,
  copySlotsWeek,
  pasteSlotsDay,
  pasteSlotsWeek,
  setSlotDayToClipboard,
  setSlotWeekToClipboard,
} from "../copyPaste";
import {
  changeCalendarDate,
  showErrSnackbar,
} from "@/store/actions/appActions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupCopyPaste, setupTestSlots } from "../__testUtils__/firestore";

import { testDateLuxon } from "@/__testData__/date";
import {
  expectedWeek,
  testDay,
  testSlots,
  testWeek,
} from "../__testData__/copyPaste";
import { __storybookDate__ } from "@/lib/constants";
import { getSlotsPath } from "@/utils/firestore";

const mockDispatch = jest.fn();

const getFirestoreSpy = jest.spyOn(firestore, "getFirestore");
const getOrganizationSpy = jest.spyOn(getters, "getOrganization");

describe("Copy Paste actions", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe("copySlotsDay", () => {
    testWithEmulator(
      "should dispatch 'setSlotDayToClipboard' with appropriate slots",
      async () => {
        // set up test state
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestSlots({
              slots: testSlots,
              db,
              store,
              organization,
            }),
        });
        // make sure test generated organziation is used
        getOrganizationSpy.mockReturnValue(organization);
        // make sure the tests use the test db
        getFirestoreSpy.mockReturnValue(db as any);
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
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestSlots({
              slots: testSlots,
              db,
              store,
              organization,
            }),
        });
        store.dispatch(changeCalendarDate(DateTime.fromISO(__storybookDate__)));
        // make sure test generated organziation is used
        getOrganizationSpy.mockReturnValue(organization);
        // make sure the tests use the test db
        getFirestoreSpy.mockReturnValue(db as any);
        // run the thunk against a store
        await copySlotsWeek()(mockDispatch, store.getState);
        // test that slots have been added to clipboard
        expect(mockDispatch).toHaveBeenCalledWith(
          setSlotWeekToClipboard(expectedWeek)
        );
      }
    );
  });

  describe("pasteSlotsDay", () => {
    testWithEmulator(
      "should update firestore with slots day from clipboard pasted to new day (with new slots having uuid generated ids and without messing up the new day)",
      async () => {
        // set up test state
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          setup: (db) =>
            setupCopyPaste({
              day: testDay,
              store,
              db,
            }),
        });
        // make sure test generated organziation is used
        getOrganizationSpy.mockReturnValue(organization);
        // make sure the tests use the test db
        getFirestoreSpy.mockReturnValue(db as any);
        // we're pasting to wednesday of test week
        const newDate = testDateLuxon.plus({ days: 2 });
        const newDateISO = luxon2ISODate(newDate);
        // run the thunk against the store
        await pasteSlotsDay(newDate)(mockDispatch, store.getState);
        const numSlotsToPaste = Object.keys(testDay).length;
        // check updated slots in db
        await db.testEnv.withSecurityRulesDisabled(async (context) => {
          const slotsInStore = await getDocs(
            collection(context.firestore(), getSlotsPath(organization))
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
        const { db, organization } = await getTestEnv({
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
        // make sure test generated organziation is used
        getOrganizationSpy.mockReturnValue(organization);
        // make sure the tests use the test db
        getFirestoreSpy.mockReturnValue(db as any);
        // run the thunk with next week as week to paste to
        const newDate = testDateLuxon.plus({ weeks: 1 });
        await pasteSlotsWeek(newDate)(mockDispatch, store.getState);
        // test that slots have been updated
        const slotsCollRef = firestore.collection(
          db,
          getSlotsPath(organization)
        );
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

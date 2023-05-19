/**
 * @vitest-environment node
 */

import { describe, vi, expect, beforeEach } from "vitest";
import { DateTime } from "luxon";

import { SlotsById, fromISO, luxon2ISODate } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { testDateLuxon } from "@eisbuk/test-data/date";
import { baseSlot } from "@eisbuk/test-data/slots";

import * as getters from "@/lib/getters";
import { __storybookDate__ } from "@/lib/constants";

import { NotifVariant } from "@/enums/store";

import { getNewStore } from "@/store/createStore";

import { getTestEnv } from "@/__testSetup__/firestore";

import {
  copySlotsDay,
  copySlotsWeek,
  pasteSlotsDay,
  pasteSlotsWeek,
} from "../copyPaste";
import { enqueueNotification } from "@/features/notifications/actions";

import {
  getDayFromClipboard,
  getWeekFromClipboard,
} from "@/store/selectors/copyPaste";

import {
  getSlotsPath,
  collection,
  getDocs,
  FirestoreVariant,
} from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupCopyPaste, setupTestSlots } from "../__testUtils__/firestore";

// #region testData
/** Day we'll be using to test copy/paste slots day */
export const testDay = {
  ["slot-0"]: {
    ...baseSlot,
    id: "slot-0",
  },
  ["slot-1"]: {
    ...baseSlot,
    id: "slot-1",
  },
};

/** Wednesday of test week (for slots in the same week, different day) */
const twoDaysFromNow = testDateLuxon.plus({ days: 2 });
const newDateISO = luxon2ISODate(twoDaysFromNow);
const testWeekWednesday = {
  ["slot-2"]: {
    ...baseSlot,
    id: "slot-2",
    date: newDateISO,
  },
  ["slot-3"]: {
    ...baseSlot,
    id: "slot-3",
    date: newDateISO,
  },
  ["slot-4"]: {
    ...baseSlot,
    id: "slot-4",
    date: newDateISO,
  },
};

/** Slots belonging to test week (keyed only by slot id) */
const testWeek = {
  ...testDay,
  ...testWeekWednesday,
};

/** Next week for test data, keyed only by slot id (should get filtered out) */
const nextWeek = Array(3)
  .fill(testDateLuxon)
  .reduce((acc, baseDate, i) => {
    const slotId = `dummy-slot-${i}`;
    const luxonDay = baseDate.plus({ weeks: 1, days: i * 2 });
    const date = luxon2ISODate(luxonDay);

    return {
      ...acc,
      [slotId]: { ...baseSlot, date, id: slotId },
    };
  }, {} as SlotsById);

/** All test slots used to populate the initial store */
export const testSlots = { ...testWeek, ...nextWeek };

/** Expected structure to be dispatched on `copySlotsDay` test */
export const expectedDay = testDay;

/** Expected structure to be dispatched on `copySlotsWeek` test */
export const expectedWeek = {
  weekStart: testDateLuxon,
  slots: Object.values(testWeek),
};

// #endregion testData

const mockDispatch = vi.fn();

const getOrganizationSpy = vi.spyOn(getters, "getOrganization");

describe("Copy Paste actions", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe("copySlotsDay", () => {
    testWithEmulator(
      "should store the slots for the day in the clipboard and remove any week slots in the clipboard (if such exist)",
      async () => {
        // set up test state
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            Promise.all([
              setupTestSlots({
                slots: testSlots,
                db,
                store,
                organization,
              }),
              setupCopyPaste({
                db,
                store,
                week: expectedWeek,
              }),
            ]),
        });
        // make sure test generated organziation is used
        getOrganizationSpy.mockReturnValue(organization);
        // make sure the tests use the test db
        const getFirestore = () => db as any;
        // run the thunk against a store
        await copySlotsDay(testDateLuxon)(store.dispatch, store.getState, {
          getFirestore,
        });
        // test that slots have been added to clipboard
        expect(getDayFromClipboard(store.getState())).toEqual(testDay);
        // check that week slots have been removed from the clipboard
        expect(getWeekFromClipboard(store.getState())).toEqual(null);
      }
    );
  });

  describe("copySlotsWeek", () => {
    testWithEmulator(
      "should store the slots for the week in the clipboard and remove any day slots in the clipboard (if such exist)",
      async () => {
        // set up test state
        const store = getNewStore({
          app: {
            calendarDay: DateTime.fromISO(__storybookDate__),
          },
        });
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            Promise.all([
              setupTestSlots({
                slots: testSlots,
                db,
                store,
                organization,
              }),
              setupCopyPaste({
                db,
                store,
                day: expectedDay,
              }),
            ]),
        });
        // make sure test generated organziation is used
        getOrganizationSpy.mockReturnValue(organization);
        // make sure the tests use the test db
        const getFirestore = () => db as any;
        // run the thunk against a store
        await copySlotsWeek()(store.dispatch, store.getState, { getFirestore });
        // test that slots have been added to clipboard
        expect(getWeekFromClipboard(store.getState())).toEqual(expectedWeek);
        // check that day slots have been removed from the clipboard
        expect(getDayFromClipboard(store.getState())).toEqual(null);
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
        const getFirestore = () => db as any;
        // we're pasting to wednesday of test week
        const newDate = testDateLuxon.plus({ days: 2 });
        const newDateISO = luxon2ISODate(newDate);
        // run the thunk against the store
        await pasteSlotsDay(newDate)(mockDispatch, store.getState, {
          getFirestore,
        });
        const numSlotsToPaste = Object.keys(testDay).length;
        // check updated slots in db
        await db.testEnv.withSecurityRulesDisabled(async (context) => {
          const slotsInStore = await getDocs(
            collection(
              FirestoreVariant.server({ instance: context.firestore() }),
              getSlotsPath(organization)
            )
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
      const testError = new Error("test");
      const getFirestore = () => {
        throw testError;
      };
      // run the faulty thunk
      await pasteSlotsDay(testDateLuxon)(mockDispatch, () => ({} as any), {
        getFirestore,
      });
      // check the error message being enqueued
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.CopyPasteErrorDay),
          variant: NotifVariant.Error,
          error: testError,
        })
      );
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
        const getFirestore = () => db as any;
        // run the thunk with next week as week to paste to
        const newDate = testDateLuxon.plus({ weeks: 1 });
        await pasteSlotsWeek(newDate)(mockDispatch, store.getState, {
          getFirestore,
        });
        // test that slots have been updated
        const slotsCollRef = collection(db, getSlotsPath(organization));
        const updatedSlots = await getDocs(slotsCollRef);
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
        const testError = new Error("test");
        const getFirestore = () => {
          throw testError;
        };
        // run the failing thunk
        await pasteSlotsWeek(testDateLuxon)(mockDispatch, () => ({} as any), {
          getFirestore,
        });
        // check the error message being enqueued
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.CopyPasteErrorWeek),
            variant: NotifVariant.Error,
            error: testError,
          })
        );
      }
    );
  });
});

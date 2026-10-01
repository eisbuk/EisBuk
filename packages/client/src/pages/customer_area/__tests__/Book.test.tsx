/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, beforeEach, afterEach } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { DateTime } from "luxon";

import {
  BookingSubCollection,
  OrgSubCollection,
  SlotInterface,
  SlotType,
  sanitizeCustomer,
} from "@eisbuk/shared";
import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";
import { testId } from "@eisbuk/testing/testIds";
import { saul } from "@eisbuk/testing/customers";

import BookView from "../views/Book";

import { getNewStore } from "@/store/createStore";
import {
  changeCalendarDate,
  setSystemDate,
  storeSecretKey,
} from "@/store/actions/appActions";
import { bookInterval } from "@/store/actions/bookingOperations";

import { renderWithRedux } from "@/__testUtils__/wrappers";

// The booking thunk is replaced with a plain action, so that we can assert
// exactly which writes the view requests (and with which parameters).
vi.mock("@/store/actions/bookingOperations", () => ({
  bookInterval: vi.fn((payload) => ({ type: "test/bookInterval", payload })),
}));

// #region testData
const month = "2022-02";
const date = "2022-02-01";

const lesson: SlotInterface = {
  id: "lesson-1",
  date,
  type: SlotType.Ice,
  categories: saul.categories,
  notes: "",
  intervals: {
    "16:00-17:00": { startTime: "16:00", endTime: "17:00" },
    "16:00-17:50": { startTime: "16:00", endTime: "17:50" },
  },
};
// A different lesson on the same day, overlapping in time with `lesson`
const otherLesson: SlotInterface = {
  ...lesson,
  id: "lesson-2",
  intervals: {
    "16:30-17:30": { startTime: "16:30", endTime: "17:30" },
  },
};
// #endregion testData

const setupStore = (
  bookedSlots: Record<string, { date: string; interval: string }> = {},
  { deadlinePassed = false } = {},
) => {
  const store = getNewStore();
  store.dispatch(
    updateLocalDocuments(OrgSubCollection.Bookings, {
      [saul.secretKey]: sanitizeCustomer(saul),
    }),
  );
  store.dispatch(
    updateLocalDocuments(OrgSubCollection.SlotsByDay, {
      [month]: {
        [date]: { [lesson.id]: lesson, [otherLesson.id]: otherLesson },
      },
    }),
  );
  store.dispatch(
    updateLocalDocuments(BookingSubCollection.BookedSlots, bookedSlots),
  );
  store.dispatch(changeCalendarDate(DateTime.fromISO(date)));
  store.dispatch(storeSecretKey(saul.secretKey));
  // Bookings for February are open until the end of January (minus the locking period)
  store.dispatch(
    setSystemDate(
      DateTime.fromISO(deadlinePassed ? "2022-02-01" : "2022-01-10"),
    ),
  );
  return store;
};

/** Returns the book/cancel button of each card, in the rendered order. */
const getCardButtons = () => screen.getAllByTestId(testId("book-button"));
/**
 * Returns the book/cancel button of the card showing the given interval (e.g. "16:00 - 17:00").
 * If more lessons contain the same interval, the first one is returned.
 */
const getButtonFor = (intervalString: string) => {
  const card = screen
    .getAllByTestId(testId("booking-interval-card"))
    .find((c) => c.textContent?.includes(intervalString));
  if (!card) throw new Error(`No card for ${intervalString}`);
  return card.querySelector(
    `[data-testid="${testId("book-button")}"]`,
  ) as HTMLButtonElement;
};

describe("Book view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  test("first booking of a lesson is a single click", () => {
    const store = setupStore();
    renderWithRedux(<BookView />, store);

    getButtonFor("16:00 - 17:00").click();

    expect(bookInterval).toHaveBeenCalledTimes(1);
    expect(bookInterval).toHaveBeenCalledWith({
      slotId: lesson.id,
      secretKey: saul.secretKey,
      date,
      interval: "16:00-17:00",
    });
    expect(store.getState().modal).toEqual([]);
  });

  test("clicking another interval of an already booked lesson asks for confirmation and does not book", () => {
    const store = setupStore({
      [lesson.id]: { date, interval: "16:00-17:00" },
    });
    renderWithRedux(<BookView />, store);

    // Click on the other (not booked) interval of the same lesson
    getButtonFor("16:00 - 17:50").click();

    expect(bookInterval).not.toHaveBeenCalled();
    const modal = store.getState().modal;
    expect(modal).toHaveLength(1);
    expect(modal[0].component).toEqual("ReplaceBookingDialog");
    expect(modal[0].props).toEqual(
      expect.objectContaining({
        id: lesson.id,
        date,
        secretKey: saul.secretKey,
        bookedInterval: "16:00-17:00",
        newInterval: "16:00-17:50",
      }),
    );
  });

  test("clicking the booked interval opens the cancel dialog (does not cancel directly)", () => {
    const store = setupStore({
      [lesson.id]: { date, interval: "16:00-17:00" },
    });
    renderWithRedux(<BookView />, store);

    getButtonFor("16:00 - 17:00").click();

    expect(bookInterval).not.toHaveBeenCalled();
    const modal = store.getState().modal;
    expect(modal).toHaveLength(1);
    expect(modal[0].component).toEqual("CancelBookingDialog");
  });

  test("booking a different lesson (same day, overlapping) leaves the existing booking alone", () => {
    const store = setupStore({
      [lesson.id]: { date, interval: "16:00-17:00" },
    });
    renderWithRedux(<BookView />, store);

    getButtonFor("16:30 - 17:30").click();

    expect(bookInterval).toHaveBeenCalledTimes(1);
    expect(bookInterval).toHaveBeenCalledWith(
      expect.objectContaining({
        slotId: otherLesson.id,
        interval: "16:30-17:30",
      }),
    );
    // Never a write to the booked lesson
    expect(bookInterval).not.toHaveBeenCalledWith(
      expect.objectContaining({ slotId: lesson.id }),
    );
  });

  test("after the deadline no card can book or cancel", () => {
    const store = setupStore(
      { [lesson.id]: { date, interval: "16:00-17:00" } },
      { deadlinePassed: true },
    );
    renderWithRedux(<BookView />, store);

    const buttons = getCardButtons();
    buttons.forEach((b) => expect(b).toHaveProperty("disabled", true));
    buttons.forEach((b) => b.click());
    expect(bookInterval).not.toHaveBeenCalled();
    expect(store.getState().modal).toEqual([]);
  });

  test("a booking whose interval was removed from the lesson is still shown, and replacing it needs confirmation (#816)", () => {
    const store = setupStore({
      // "15:00-16:00" no longer exists in 'lesson'
      [lesson.id]: { date, interval: "15:00-16:00" },
    });
    renderWithRedux(<BookView />, store);

    // The removed interval is rendered (as booked) in addition to the existing ones
    screen.getByText("15:00 - 16:00");
    expect(getCardButtons()).toHaveLength(4);

    // Clicking one of the existing intervals asks before replacing the booking
    getButtonFor("16:00 - 17:00").click();
    expect(bookInterval).not.toHaveBeenCalled();
    expect(store.getState().modal[0]).toEqual(
      expect.objectContaining({
        component: "ReplaceBookingDialog",
        props: expect.objectContaining({ bookedInterval: "15:00-16:00" }),
      }),
    );
  });
});

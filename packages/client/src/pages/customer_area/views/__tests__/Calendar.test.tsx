/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, beforeEach, afterEach } from "vitest";
import { screen, act } from "@testing-library/react";
import { DateTime } from "luxon";

import i18n, { ActionButton } from "@eisbuk/translations";
import {
  BookingSubCollection,
  Category,
  OrgSubCollection,
  SlotInterface,
  SlotType,
} from "@eisbuk/shared";
import { testId } from "@eisbuk/testing/testIds";
import {
  deleteLocalDocuments,
  markDocumentsReceived,
  updateLocalDocuments,
} from "@eisbuk/react-redux-firebase-firestore";

import CalendarView from "../Calendar";

import { getNewStore } from "@/store/createStore";

import { renderWithRedux } from "@/__testUtils__/wrappers";

// Avoid initializing firebase (the view only needs `functions` to update booking notes)
vi.mock("@/setup", () => ({ functions: {} }));

// All data here is invented
const secretKey = "test-secret-key";

const createSlot = (
  id: string,
  date: string,
  interval: string
): SlotInterface => {
  const [startTime, endTime] = interval.split("-");
  return {
    id,
    date,
    type: SlotType.Ice,
    categories: [Category.Competitive],
    notes: "Pista 1",
    intervals: { [interval]: { startTime, endTime } },
  };
};

const slotA = createSlot("slot-a", "2026-10-02", "16:00-17:50");
const slotB = createSlot("slot-b", "2026-10-06", "16:10-17:00");

const setupStore = () =>
  getNewStore({
    firestore: {
      data: {
        slotsByDay: {
          "2026-10": {
            "2026-10-02": { [slotA.id]: slotA },
            "2026-10-06": { [slotB.id]: slotB },
          },
        },
        bookedSlots: {
          [slotA.id]: { date: slotA.date, interval: "16:00-17:50" },
        },
      },
      // The month documents' listener, as registered by the customer area
      listeners: {
        [OrgSubCollection.SlotsByDay]: {
          consumers: ["consumer-id"],
          unsubscribe: () => {},
          documents: ["2026-09", "2026-10", "2026-11"],
          meta: {
            organization: "test-organization",
            currentDate: DateTime.fromISO("2026-10-01"),
          },
        },
      },
    },
    app: { calendarDay: DateTime.fromISO("2026-10-01"), secretKey },
  });

const getMonthTotal = () => screen.getByTestId(testId("month-total"));

describe("Customer area calendar view", () => {
  beforeEach(() => {
    // Before the booking deadline for October
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-01T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("should update the month total when a booking is made or cancelled, without reloading", () => {
    const store = setupStore();
    renderWithRedux(<CalendarView />, store);

    expect(getMonthTotal().textContent).toEqual("1 h 50 min");

    act(() => {
      store.dispatch(
        updateLocalDocuments(BookingSubCollection.BookedSlots, {
          [slotB.id]: { date: slotB.date, interval: "16:10-17:00" },
        })
      );
    });
    expect(getMonthTotal().textContent).toEqual("2 h 40 min");
    expect(screen.getAllByTestId(testId("booking-calendar-card"))).toHaveLength(
      2
    );

    act(() => {
      store.dispatch(
        deleteLocalDocuments(BookingSubCollection.BookedSlots, [slotA.id])
      );
    });
    expect(getMonthTotal().textContent).toEqual("50 min");
    expect(screen.getAllByTestId(testId("booking-calendar-card"))).toHaveLength(
      1
    );
  });

  test("should open the cancel booking dialog with the booked slot and interval", () => {
    const store = setupStore();
    renderWithRedux(<CalendarView />, store);

    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();

    const [modal] = store.getState().modal;
    expect(modal.component).toEqual("CancelBookingDialog");
    expect(modal.props).toEqual(
      expect.objectContaining({
        ...slotA,
        interval: { startTime: "16:00", endTime: "17:50" },
        secretKey,
      })
    );
  });

  test("should disable cancellation after the booking deadline", () => {
    vi.setSystemTime(new Date("2026-10-10T10:00:00Z"));
    renderWithRedux(<CalendarView />, setupStore());

    expect(
      screen.getByText(i18n.t(ActionButton.Cancel) as string).closest("button")
        ?.disabled
    ).toBe(true);
  });

  test("should show the 'no bookings' message for a month without bookings", () => {
    const store = setupStore();
    act(() => {
      store.dispatch(
        deleteLocalDocuments(BookingSubCollection.BookedSlots, [slotA.id])
      );
    });
    renderWithRedux(<CalendarView />, store);

    expect(screen.queryByTestId(testId("month-total"))).toBeNull();
  });

  test("should report the bookings of a month whose 'slotsByDay' document no longer exists", () => {
    // E.g. the month's last lesson was deleted and 'pruneSlotsByDay' removed the month's document,
    // while the athlete's booking remained
    const store = setupStore();
    renderWithRedux(<CalendarView />, store);

    act(() => {
      store.dispatch(
        deleteLocalDocuments(OrgSubCollection.SlotsByDay, ["2026-10"])
      );
      store.dispatch(
        markDocumentsReceived(OrgSubCollection.SlotsByDay, ["2026-10"])
      );
    });

    expect(getMonthTotal().textContent).toEqual("0 h");
    expect(
      screen.getByTestId(testId("excluded-bookings")).textContent
    ).toContain("2 October");
    expect(
      screen.queryAllByTestId(testId("booking-calendar-card"))
    ).toHaveLength(0);
  });
});

/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, expect, test, afterEach } from "vitest";
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
import { saul } from "@eisbuk/testing/customers";

import CalendarView from "../views/Calendar";

import { getNewStore } from "@/store/createStore";
import {
  changeCalendarDate,
  setSystemDate,
  storeSecretKey,
} from "@/store/actions/appActions";

import { renderWithRedux } from "@/__testUtils__/wrappers";

/**
 * Regression for #816: an admin removed the booked interval from the lesson after the athlete had booked it.
 * The athlete's calendar used to crash (reading `startTime` of `undefined`).
 */
describe("Customer calendar view, booked interval removed from the lesson (#816)", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders the booking with its booked times instead of crashing", () => {
    const month = "2022-02";
    const date = "2022-02-01";
    // "08:00-09:00" was booked, then removed from the lesson
    const lesson: SlotInterface = {
      id: "lesson-1",
      date,
      type: SlotType.Ice,
      categories: saul.categories,
      notes: "",
      intervals: {
        "08:00-09:30": { startTime: "08:00", endTime: "09:30" },
      },
    };
    const otherLesson: SlotInterface = {
      ...lesson,
      id: "lesson-2",
      intervals: {
        "10:00-11:00": { startTime: "10:00", endTime: "11:00" },
      },
    };

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
      updateLocalDocuments(BookingSubCollection.BookedSlots, {
        [lesson.id]: { date, interval: "08:00-09:00" },
        [otherLesson.id]: { date, interval: "10:00-11:00" },
      }),
    );
    store.dispatch(changeCalendarDate(DateTime.fromISO(date)));
    store.dispatch(storeSecretKey(saul.secretKey));
    store.dispatch(setSystemDate(DateTime.fromISO("2022-01-10")));

    renderWithRedux(<CalendarView />, store);

    screen.getByText("08:00 - 09:00");
    screen.getByText("10:00 - 11:00");
    expect(screen.queryByText("08:00 - 09:30")).toBeNull();
  });
});

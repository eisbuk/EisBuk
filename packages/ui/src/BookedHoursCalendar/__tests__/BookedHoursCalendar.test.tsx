import React from "react";
import { vi, afterEach, expect, test, describe } from "vitest";
import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import i18n, { ActionButton, BookedHours } from "@eisbuk/translations";
import { testId } from "@eisbuk/testing/testIds";

import BookedHoursCalendar from "../BookedHoursCalendar";

import { formatMinutes } from "../utils";

import {
  buildSummary,
  octoberSummary,
  octoberSummaryWithExcluded,
} from "../__testData__";

describe("BookedHoursCalendar", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe("formatMinutes", () => {
    test("should format minutes as hours and minutes of clock time", () => {
      expect(formatMinutes(0)).toEqual("0 h");
      expect(formatMinutes(50)).toEqual("50 min");
      expect(formatMinutes(120)).toEqual("2 h");
      expect(formatMinutes(435)).toEqual("7 h 15 min");
    });
  });

  test("should show the month total first, then the weekly totals adding up to it", () => {
    render(<BookedHoursCalendar summary={octoberSummary} />);

    expect(screen.getByTestId(testId("month-total")).textContent).toEqual(
      "7 h 15 min"
    );
    expect(
      screen.getByText(
        i18n.t(BookedHours.MonthTotalNote, { count: 6 }) as string
      )
    ).toBeTruthy();

    const weekTotals = screen
      .getAllByTestId(testId("week-total"))
      .map((cell) => cell.textContent);
    expect(weekTotals).toEqual([
      "1 h 50 min",
      "2 h 30 min",
      "1 h 15 min",
      "50 min",
      "50 min",
    ]);
  });

  test("should place the days of the month under their week days, Monday first", () => {
    render(<BookedHoursCalendar summary={octoberSummary} />);

    const rows = within(screen.getByTestId(testId("month-overview")))
      .getAllByRole("row")
      // Remove header and footer
      .slice(1, -1);
    const firstWeekCells = within(rows[0])
      .getAllByRole("cell")
      .map((cell) => cell.textContent);
    // October 1st 2026 is a Thursday
    expect(firstWeekCells).toEqual([
      "",
      "",
      "",
      "1",
      "2",
      "3",
      "4",
      "1 h 50 min",
    ]);
  });

  test("should list the booked sessions grouped by week and day", () => {
    render(<BookedHoursCalendar summary={octoberSummary} />);

    const weeks = screen.getAllByTestId(testId("week-section"));
    expect(weeks.map((week) => week.getAttribute("data-start-date"))).toEqual([
      "2026-10-01",
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
    ]);

    const days = screen.getAllByTestId(testId("calendar-day"));
    const sixth = days.find((day) => day.dataset.date === "2026-10-06")!;
    expect(
      within(sixth).getAllByTestId(testId("booking-calendar-card"))
    ).toHaveLength(2);
    // Booked sessions only (the attended-only one isn't a booking)
    expect(screen.getAllByTestId(testId("booking-calendar-card"))).toHaveLength(
      6
    );
    expect(
      screen.getByText(i18n.t(BookedHours.AttendedOnly) as string)
    ).toBeTruthy();
    // Booking notes are shown
    expect(screen.getByText("Arrivo alle 17:15")).toBeTruthy();
  });

  test("should call 'onCancel' with the session when cancel is clicked", () => {
    const onCancel = vi.fn();
    render(
      <BookedHoursCalendar summary={octoberSummary} onCancel={onCancel} />
    );

    screen.getAllByText(i18n.t(ActionButton.Cancel) as string)[0].click();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(
      expect.objectContaining({ id: "s1", date: "2026-10-02" })
    );
  });

  test("should disable cancelling if 'disabled'", () => {
    const onCancel = vi.fn();
    render(
      <BookedHoursCalendar
        summary={octoberSummary}
        onCancel={onCancel}
        disabled
      />
    );

    const buttons = screen.getAllByText(i18n.t(ActionButton.Cancel) as string);
    buttons.forEach((button) =>
      expect(button.closest("button")?.disabled).toBe(true)
    );
  });

  test("should save booking notes", async () => {
    const onNotesEditSave = vi.fn().mockResolvedValue(undefined);
    render(
      <BookedHoursCalendar
        summary={octoberSummary}
        onNotesEditSave={onNotesEditSave}
      />
    );

    const [firstNotesButton] = screen.getAllByRole("button", {
      name: i18n.t(BookedHours.BookingNotes) as string,
    });
    userEvent.click(firstNotesButton);
    const textarea = screen.getByRole("textbox");
    userEvent.type(textarea, "Porto i pattini nuovi");
    const form = textarea.closest("form")!;
    userEvent.click(form.querySelector("button[type='submit']")!);

    await waitFor(() =>
      expect(onNotesEditSave).toHaveBeenCalledWith(
        expect.objectContaining({ id: "s1" }),
        "Porto i pattini nuovi"
      )
    );
  });

  test("should report the bookings not included in the total", () => {
    render(<BookedHoursCalendar summary={octoberSummaryWithExcluded} />);

    expect(screen.getByTestId(testId("excluded-bookings")).textContent).toEqual(
      i18n.t(BookedHours.ExcludedBookings, {
        count: 1,
        dates: "20 October",
      }) as string
    );
    expect(screen.getByTestId(testId("month-total")).textContent).toEqual(
      "7 h 15 min"
    );
  });

  test("should show a zero total for a month without bookings", () => {
    render(<BookedHoursCalendar summary={buildSummary("2026-11", [])} />);

    expect(screen.getByTestId(testId("month-total")).textContent).toEqual(
      "0 h"
    );
    expect(screen.queryAllByTestId(testId("week-section"))).toHaveLength(0);
  });
});

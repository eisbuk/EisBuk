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

import { formatHours } from "../utils";

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

  describe("formatHours", () => {
    test("should format lesson hours", () => {
      expect(formatHours(0)).toEqual("0 hours");
      expect(formatHours(1)).toEqual("1 hour");
      expect(formatHours(1.5)).toEqual("1.5 hours");
      expect(formatHours(8.5)).toEqual("8.5 hours");
    });
  });

  test("should show the month total first, then the weekly totals adding up to it", () => {
    render(<BookedHoursCalendar summary={octoberSummary} />);

    expect(screen.getByTestId(testId("month-total")).textContent).toEqual(
      "8.5 hours"
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
      "2 hours",
      "3 hours",
      "1.5 hours",
      "1 hour",
      "1 hour",
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
    expect(firstWeekCells).toEqual(["", "", "", "1", "2", "3", "4", "2 hours"]);
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
      "8.5 hours"
    );
  });

  test("should show a zero total for a month without bookings", () => {
    render(<BookedHoursCalendar summary={buildSummary("2026-11", [])} />);

    expect(screen.getByTestId(testId("month-total")).textContent).toEqual(
      "0 hours"
    );
    expect(screen.queryAllByTestId(testId("week-section"))).toHaveLength(0);
  });

  test("should show a booking whose lesson isn't available, with its times and the cancel button", () => {
    const onCancel = vi.fn();
    const summary = buildSummary("2026-11", [
      {
        id: "lesson-not-loaded",
        date: "2026-11-04",
        interval: { startTime: "17:00", endTime: "17:50" },
        hours: 1,
        booked: true,
      },
    ]);
    render(<BookedHoursCalendar summary={summary} onCancel={onCancel} />);

    const [card] = screen.getAllByTestId(testId("booking-calendar-card"));
    expect(card.textContent).toContain("17:00 - 17:50");
    expect(card.textContent).toContain("1 hour");
    expect(screen.getByTestId(testId("month-total")).textContent).toEqual(
      "1 hour"
    );

    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(onCancel).toHaveBeenCalledWith(
      expect.objectContaining({ id: "lesson-not-loaded", date: "2026-11-04" })
    );
  });
});

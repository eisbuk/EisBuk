import React from "react";
import { vi, beforeEach, afterEach, expect, test, describe } from "vitest";
import { cleanup, screen, waitFor, render } from "@testing-library/react";

import i18n, { AttendanceAria } from "@eisbuk/translations";

import UserAttendance from "../UserAttendance";

import { comparePeriods } from "../../utils/sort";

import { saul } from "@eisbuk/testing/customers";
import { baseSlot } from "@eisbuk/testing/slots";

// interval values we're using across tests
const intervals = Object.keys(baseSlot.intervals).sort(comparePeriods);

// provide a polyfill for element.animate function
if (typeof Element.prototype.animate !== "function") {
  // we won't be testing the animate function. We just need it to not fail the tests
  // therefore an empty function will suffice
  Element.prototype.animate = () => Object.create({});
}

const getMarkPresent = () =>
  screen.getByRole("button", { name: i18n.t(AttendanceAria.MarkPresent) });
const queryMarkPresent = () =>
  screen.queryByRole("button", { name: i18n.t(AttendanceAria.MarkPresent) });
const getMarkAbsent = () =>
  screen.getByRole("button", { name: i18n.t(AttendanceAria.MarkAbsent) });

describe("AttendanceCard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Test marking attendance functionality", () => {
    test("should update local state immediately on button click", () => {
      render(
        <UserAttendance
          {...saul}
          intervals={intervals}
          bookedInterval={intervals[1]}
          attendedInterval={null}
        />
      );
      getMarkPresent().click();
      // The toggle button will have changed to "mark absent" button
      expect(queryMarkPresent()).toBeNull();
      getMarkAbsent();
    });

    test("should call 'markAttendance' on attendance button click if `attended = null` (and default to booked interval if no interval was specified)", () => {
      const mockMarkAttendance = vi.fn();
      render(
        <UserAttendance
          {...saul}
          intervals={intervals}
          bookedInterval={intervals[1]}
          attendedInterval={null}
          markAttendance={mockMarkAttendance}
        />
      );
      getMarkPresent().click();
      expect(mockMarkAttendance).toHaveBeenCalledWith({
        attendedInterval: intervals[1],
      });
    });

    test("should call 'markAbsence' on attendance button click if `attended != null`", () => {
      const mockMarkAbsence = vi.fn();
      render(
        <UserAttendance
          {...saul}
          intervals={intervals}
          bookedInterval={intervals[1]}
          attendedInterval={intervals[1]}
          markAbsence={mockMarkAbsence}
        />
      );
      getMarkAbsent().click();
      expect(mockMarkAbsence).toHaveBeenCalled();
    });

    test("should disable attendance button while there's a discrepancy between local attended and attended from firestore (boolean)", () => {
      render(
        <UserAttendance
          {...saul}
          intervals={intervals}
          bookedInterval={intervals[1]}
          attendedInterval={null}
        />
      );
      getMarkPresent().click();
      // We've created a discrepancy by updating local state, whilst attendance from props stayed the same.
      // The toggle button will have changed to "mark absent" button, but it should be disabled (due to the discrepancy).
      expect(getMarkAbsent()).toHaveProperty("disabled", true);
    });

    test("should disable attendance button while picking new interval - 'attendedInterval != selectedInterval'", () => {
      render(
        <UserAttendance
          {...saul}
          intervals={intervals}
          bookedInterval={intervals[1]}
          attendedInterval={intervals[1]}
        />
      );
      screen
        .getByRole("button", { name: i18n.t(AttendanceAria.NextInterval) })
        .click();
      // We've created a discrepancy by updating local state, whilst attendedInterval from props stayed the same
      expect(getMarkAbsent()).toHaveProperty("disabled", true);
    });
  });

  describe("Test interval picker ->", () => {
    const mockMarkAttendance = vi.fn();

    beforeEach(() => {
      render(
        <UserAttendance
          {...saul}
          intervals={intervals}
          bookedInterval={intervals[1]}
          attendedInterval={intervals[1]}
          markAttendance={mockMarkAttendance}
        />
      );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    test("should show booked interval (if any) when the attended and booked interval are different", () => {
      // only one interval should be shown in case both booked and attended are the same
      const displayedIntervals = screen.queryAllByText(intervals[1]);
      expect(displayedIntervals).toHaveLength(1);
      screen
        .getByRole("button", { name: i18n.t(AttendanceAria.NextInterval) })
        .click();
      screen.getByText(intervals[1]);
      screen.getByText(intervals[2]);
    });

    test("should disable prev button if first interval selected and next if last selected", () => {
      const prevButton = screen.getByRole("button", {
        name: i18n.t(AttendanceAria.PreviousInterval),
      });
      const nextButton = screen.getByRole("button", {
        name: i18n.t(AttendanceAria.NextInterval),
      });
      // buttons shouldn't be disabled as we're starting with middle interval
      expect(prevButton).not.toHaveProperty("disabled", true);
      // switch to first interval
      prevButton.click();
      expect(prevButton).toHaveProperty("disabled", true);
      expect(nextButton).not.toHaveProperty("disabled", true);
      // switch to last interval (there are 3 in total)
      nextButton.click();
      nextButton.click();
      expect(prevButton).not.toHaveProperty("disabled", true);
      expect(nextButton).toHaveProperty("disabled", true);
    });

    test("should disable the interval picker if 'localAttended = false'", () => {
      // set local attendance to false
      getMarkAbsent().click();
      const prevButton = screen.getByRole("button", {
        name: i18n.t(AttendanceAria.PreviousInterval),
      });
      const nextButton = screen.getByRole("button", {
        name: i18n.t(AttendanceAria.NextInterval),
      });
      expect(prevButton).toHaveProperty("disabled", true);
      expect(nextButton).toHaveProperty("disabled", true);
    });

    test("should dispatch 'markAttendance' on change of interval", async () => {
      screen
        .getByRole("button", { name: i18n.t(AttendanceAria.NextInterval) })
        .click();
      await waitFor(() =>
        expect(mockMarkAttendance).toHaveBeenCalledWith({
          attendedInterval: intervals[2],
        })
      );
    });

    test("should display booked interval when customer marked as absent", async () => {
      // Only in this test, we need a setup different from the one in beforeEach
      cleanup();
      render(
        <UserAttendance
          {...saul}
          intervals={intervals}
          bookedInterval={intervals[1]}
          attendedInterval={intervals[2]}
          markAttendance={mockMarkAttendance}
        />
      );
      // As we've tested already, both booked and attended should be shown
      screen.getByText(intervals[1]);
      screen.getByText(intervals[2]);
      // Mark absence (thus resetting to booked interval)
      getMarkAbsent().click();

      await waitFor(() => screen.getByText(intervals[1]));
      await waitFor(() => expect(screen.queryByText(intervals[2])).toBeNull());
    });
  });

  describe("Test debounce", () => {
    const mockMarkAttendance = vi.fn();

    afterEach(() => {
      vi.clearAllMocks();
    });

    test("should only dispatch interval update once if changes are too close to each other", async () => {
      render(
        <UserAttendance
          {...saul}
          intervals={intervals}
          bookedInterval={intervals[0]}
          attendedInterval={intervals[0]}
          markAttendance={mockMarkAttendance}
        />
      );
      // We're testing with first interval as initial
      const nextButton = screen.getByRole("button", {
        name: i18n.t(AttendanceAria.NextInterval),
      });
      // selectedInterval -> interval[1]
      nextButton.click();
      expect(mockMarkAttendance).toHaveBeenCalledTimes(0);
      await hold(200);
      expect(mockMarkAttendance).toHaveBeenCalledTimes(0);
      // selectedInterval -> interval[2]
      nextButton.click();
      await hold(1000);
      // final interval = interval[2]
      expect(mockMarkAttendance).toHaveBeenCalledWith({
        attendedInterval: intervals[2],
      });
    });
  });
});

const hold = (timeout: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeout);
  });

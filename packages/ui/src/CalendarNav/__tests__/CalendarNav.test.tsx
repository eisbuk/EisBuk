import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { DateTime, DateTimeUnit } from "luxon";

import CalendarNav from "../CalendarNav";

interface TestParams {
  currentDate: string;
  jump: DateTimeUnit;
  prev: string;
  next: string;
}

const runDateTableTests = (tests: TestParams[]) => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks;
  });

  tests.forEach(({ currentDate, jump, next, prev }) => {
    test(`CurrentDate: "${currentDate}", jump: "${jump}", want prev: "${prev}", want next: "${next}"`, () => {
      const date = DateTime.fromISO(currentDate);

      const mockOnChange = jest.fn();

      render(<CalendarNav onChange={mockOnChange} {...{ jump, date }} />);

      const [prevButton, nextButton] = screen.getAllByRole("button");
      prevButton.click();
      nextButton.click();

      expect(mockOnChange).toHaveBeenCalledTimes(2);

      // Get prev and next calls in ISO format (for comparison)
      const [prevCalled, nextCalled] = mockOnChange.mock.calls.map(([date]) =>
        (date as DateTime).toISODate()
      );

      expect(prevCalled).toEqual(prev);
      expect(nextCalled).toEqual(next);
    });
  });
};

describe("CalendarNav", () => {
  describe("Date switching table tests", () => {
    runDateTableTests([
      {
        currentDate: "2022-06-01",
        jump: "day",
        prev: "2022-05-31",
        next: "2022-06-02",
      },
      {
        currentDate: "2022-06-03",
        jump: "day",
        prev: "2022-06-02",
        next: "2022-06-04",
      },
      {
        currentDate: "2022-06-06",
        jump: "week",
        prev: "2022-05-30",
        next: "2022-06-13",
      },
      {
        currentDate: "2022-06-07",
        jump: "week",
        prev: "2022-05-31",
        next: "2022-06-14",
      },
      {
        currentDate: "2022-06-07",
        jump: "month",
        prev: "2022-05-07",
        next: "2022-07-07",
      },
    ]);
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";

import BookingsCountdown, {
  BookingsCountdownVariant,
} from "../BookingsCountdown";
import { DateTime } from "luxon";

const deadline = DateTime.now().plus({ days: 2 });
const month = deadline.plus({ months: 1 });

describe("BookingsCountdown", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should fire 'onFialize' on finalize button click (on second deadline variant)", () => {
    const mockOnFinalize = jest.fn();
    render(
      <BookingsCountdown
        {...{ deadline, month }}
        variant={BookingsCountdownVariant.SecondDeadline}
        onFinalize={mockOnFinalize}
      />
    );
    screen.getByRole("button").click();
    expect(mockOnFinalize).toHaveBeenCalled();
  });

  test("should ont explode if 'onFinalize' not provided", () => {
    render(
      <BookingsCountdown
        {...{ deadline, month }}
        variant={BookingsCountdownVariant.SecondDeadline}
      />
    );
    screen.getByRole("button").click();
  });
});

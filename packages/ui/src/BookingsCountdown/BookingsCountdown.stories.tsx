import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import BookingsCountdown, {
  BookingsCountdownVariant,
} from "./BookingsCountdown";

export default {
  title: "Bookings Countdown",
  component: BookingsCountdown,
} as ComponentMeta<typeof BookingsCountdown>;

// Show countdown until two days from now (to keep elements dislpayed constant for visual regression)
const countdownDate = DateTime.now().plus({ days: 2 });

const message = "Bookings end in:";

export const Variants = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Variant: "first-deadline"</h1>
    <BookingsCountdown
      {...{ countdownDate, message }}
      variant={BookingsCountdownVariant.FirstDeadline}
    />
    <h1 className="text-lg font-bold mb-4">Variant: "second-deadline"</h1>
    <BookingsCountdown
      {...{ countdownDate, message }}
      variant={BookingsCountdownVariant.SecondDeadline}
    />
    <h1 className="text-lg font-bold mb-4">Variant: "bookings-locked"</h1>
    <BookingsCountdown
      {...{ countdownDate, message }}
      variant={BookingsCountdownVariant.BookingsLocked}
    />
  </>
);

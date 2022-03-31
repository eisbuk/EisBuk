import React from "react";
import { DateTime } from "luxon";

import { BookingCountdownMessage } from "@/enums/translations";

import BookingsCountdown from "./BookingsCountdown";

export default {
  title: "Booking Countdown",
  component: BookingsCountdown,
};

const deadline = DateTime.now().plus({ days: 2, hours: 24 });
const month = deadline.plus({ months: 1 }).startOf("month");

export const FirstDeadline = (): JSX.Element => (
  <BookingsCountdown
    {...{ deadline, month }}
    message={BookingCountdownMessage.FirstDeadline}
  />
);

export const SecondDeadline = (): JSX.Element => (
  <BookingsCountdown
    {...{ deadline, month }}
    message={BookingCountdownMessage.SecondDeadline}
  />
);

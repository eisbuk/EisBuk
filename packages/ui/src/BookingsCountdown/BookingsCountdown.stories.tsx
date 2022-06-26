import React from "react";
import { ComponentMeta } from "@storybook/react";

import BookingsCountdown from "./BookingsCountdown";

export default {
  title: "Bookings Countdown",
  component: BookingsCountdown,
} as ComponentMeta<typeof BookingsCountdown>;

export const Default = (): JSX.Element => <BookingsCountdown />;

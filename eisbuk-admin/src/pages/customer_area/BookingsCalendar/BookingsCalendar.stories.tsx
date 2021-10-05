import React from "react";
import { ComponentMeta } from "@storybook/react";

import BookingsCalendar from "./BookingsCalendar";

import { bookedSlots, slots } from "./__testData__/dummyData";

export default {
  title: "Bookings Calendar",
  component: BookingsCalendar,
} as ComponentMeta<typeof BookingsCalendar>;

export const Default = (): JSX.Element => (
  <BookingsCalendar {...{ bookedSlots, slots }} />
);

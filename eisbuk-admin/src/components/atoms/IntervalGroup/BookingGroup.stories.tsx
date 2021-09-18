import React from "react";
import { ComponentMeta } from "@storybook/react";

import BookingGroup from "./BookingGroup";

export default {
  title: "Booking Group",
  component: BookingGroup,
} as ComponentMeta<typeof BookingGroup>;

export const Default = (): JSX.Element => <BookingGroup />;

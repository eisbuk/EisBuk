import React from "react";
import { ComponentMeta } from "@storybook/react";

import BookingCardGroup from "./BookingCardGroup";

import { slot } from "./__testData__/dummyData";

export default {
  title: "Booking Card Group",
  component: BookingCardGroup,
} as ComponentMeta<typeof BookingCardGroup>;

export const Default = (): JSX.Element => <BookingCardGroup {...slot} />;

import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import BookingCardGroup from "./BookingCardGroup";
import SlotsDayContainer from "@/components/atoms/SlotsDayContainer";

import { slot, customerId, intervals } from "./__testData__/dummyData";
import { __storybookDate__ } from "@/lib/constants";

export default {
  title: "Booking Card Group",
  component: BookingCardGroup,
  decorators: [
    (Story) => (
      <SlotsDayContainer date={DateTime.fromISO(__storybookDate__)}>
        <Story />
      </SlotsDayContainer>
    ),
  ],
} as ComponentMeta<typeof BookingCardGroup>;

export const Default = (): JSX.Element => (
  <BookingCardGroup {...{ ...slot, customerId }} />
);

export const WithBookedInterval = (): JSX.Element => (
  <BookingCardGroup
    {...{ ...slot, customerId, bookedInterval: Object.keys(intervals)[0] }}
  />
);

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
} as ComponentMeta<typeof BookingCardGroup>;

export const Default = (): JSX.Element => (
  <SlotsDayContainer date={DateTime.fromISO(__storybookDate__)}>
    {({ WrapElement }) => (
      <BookingCardGroup {...{ ...slot, customerId, WrapElement }} />
    )}
  </SlotsDayContainer>
);

export const WithBookedInterval = (): JSX.Element => (
  <SlotsDayContainer date={DateTime.fromISO(__storybookDate__)}>
    {({ WrapElement }) => (
      <BookingCardGroup
        {...{
          ...slot,
          customerId,
          WrapElement,
          bookedInterval: Object.keys(intervals)[0],
        }}
      />
    )}
  </SlotsDayContainer>
);

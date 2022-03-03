import React from "react";
import { ComponentMeta } from "@storybook/react";

import BookingCardGroup from "./BookingCardGroup";
import SlotsDayContainer from "@/components/atoms/SlotsDayContainer";

import { baseSlot, intervals } from "@/__testData__/slots";
import { saul } from "@/__testData__/customers";
import { testDateLuxon } from "@/__testData__/date";

export default {
  title: "Booking Card Group",
  component: BookingCardGroup,
} as ComponentMeta<typeof BookingCardGroup>;

export const Default = (): JSX.Element => (
  <SlotsDayContainer date={testDateLuxon}>
    {({ WrapElement }) => (
      <BookingCardGroup
        {...{ ...baseSlot, customerId: saul.id, WrapElement }}
      />
    )}
  </SlotsDayContainer>
);

export const WithBookedInterval = (): JSX.Element => (
  <SlotsDayContainer date={testDateLuxon}>
    {({ WrapElement }) => (
      <BookingCardGroup
        {...{
          ...baseSlot,
          customerId: saul.id,
          WrapElement,
          bookedInterval: Object.keys(intervals)[0],
        }}
      />
    )}
  </SlotsDayContainer>
);

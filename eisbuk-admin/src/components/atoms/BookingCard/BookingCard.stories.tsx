import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import { Duration } from "eisbuk-shared";

import BookingCard from "./BookingCard";

import { dummySlot } from "@/__testData__/dummyData";
import { SlotView } from "@/enums/components";

export default {
  title: "Booking Card",
  component: BookingCard,
} as ComponentMeta<typeof BookingCard>;

const Template: ComponentStory<typeof BookingCard> = (args) => (
  <BookingCard {...args} />
);

export const Default = Template.bind({});
Default.args = {
  ...dummySlot,
  view: SlotView.Calendar,
};

const calendarProps = { view: SlotView.Calendar };
export const Calendar = (): JSX.Element => (
  <BookingCard {...dummySlot} {...calendarProps} />
);

const bookingProps = { view: SlotView.Booking };
export const Booking = (): JSX.Element => (
  <BookingCard {...dummySlot} {...bookingProps} />
);

import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import { DeprecatedDuration as Duration } from "eisbuk-shared/dist/enums/deprecated/firestore";

import BookingCard from "./BookingCard";

import { baseSlot } from "@/__testData__/dummyData";

export default {
  title: "Booking Card",
  component: BookingCard,
} as ComponentMeta<typeof BookingCard>;

const Template: ComponentStory<typeof BookingCard> = (args) => (
  <BookingCard {...args} />
);

export const Default = Template.bind({});
Default.args = {
  ...baseSlot,
  bookedDuration: Duration["1.5h"],
};

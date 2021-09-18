import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import { Duration } from "eisbuk-shared";

import BookingCard from "./BookingCard";

import { dummySlot } from "@/__testData__/dummyData";

export default {
  title: "Booking Card",
  component: BookingCard,
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
} as ComponentMeta<typeof BookingCard>;

const Template: ComponentStory<typeof BookingCard> = (args) => (
  <BookingCard {...args} />
);

export const Default = Template.bind({});
Default.args = {
  ...dummySlot,
  bookedDuration: Duration["1.5h"],
};

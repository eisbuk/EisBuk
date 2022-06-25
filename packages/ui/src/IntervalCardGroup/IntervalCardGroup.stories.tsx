import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import { Category, SlotInterface, SlotType } from "@eisbuk/shared";

import IntervalCardGroup from "./IntervalCardGroup";

export default {
  title: "Interval Card Group",
  component: IntervalCardGroup,
} as ComponentMeta<typeof IntervalCardGroup>;

const dummySlot: SlotInterface = {
  id: "ice-slot",
  type: SlotType.Ice,
  categories: [Category.Competitive],
  date: "2022-01-01",
  intervals: {
    "09:00-11:00": {
      startTime: "09:00",
      endTime: "11:00",
    },
    "09:00-10:30": {
      startTime: "09:00",
      endTime: "10:30",
    },
    "09:00-10:00": {
      startTime: "09:00",
      endTime: "10:00",
    },
  },
  notes: "Rink 1",
};

export const Interactive = (): JSX.Element => {
  const [bookedInterval, setBookedInterval] = useState<string | null>(
    "09:00-11:00"
  );

  return (
    <IntervalCardGroup
      {...{ ...dummySlot, bookedInterval }}
      onBook={(interval) => setBookedInterval(interval)}
      onCancel={() => setBookedInterval(null)}
    />
  );
};

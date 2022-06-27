import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import { Category, SlotInterface, SlotType } from "@eisbuk/shared";

import SlotsDayContainer from "./SlotsDayContainer";
import IntervalCard from "../IntervalCard";

export default {
  title: "Slots Day Container",
  component: SlotsDayContainer,
} as ComponentMeta<typeof SlotsDayContainer>;

const dateISO = "2022-01-01";
const date = DateTime.fromISO(dateISO);

const iceSlot: SlotInterface = {
  id: "ice-slot",
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
  categories: [Category.Competitive],
  type: SlotType.Ice,
  date: dateISO,
  notes: "Rink 1",
};
const offIceSlot = {
  ...iceSlot,
  id: "off-ice-slot",
  type: SlotType.OffIce,
};

export const Empty = (): JSX.Element => (
  <SlotsDayContainer {...{ date }}></SlotsDayContainer>
);

export const WithSlots = (): JSX.Element => (
  <SlotsDayContainer {...{ date }}>
    {Object.keys(iceSlot.intervals).map((key) => (
      <IntervalCard
        key={`ice-${key}`}
        {...iceSlot}
        interval={iceSlot.intervals[key]}
      />
    ))}
    {Object.keys(offIceSlot.intervals).map((key) => (
      <IntervalCard
        key={`off-ice-${key}`}
        {...offIceSlot}
        interval={iceSlot.intervals[key]}
      />
    ))}
  </SlotsDayContainer>
);

import React from "react";
import { ComponentMeta } from "@storybook/react";

import { SlotType } from "@eisbuk/shared";

import { IntervalCardState, IntervalCardVariant } from "./types";

import IntervalCard from "./IntervalCard";

import { StorybookGrid, StorybookItem } from "../utils/storybook";

export default {
  title: "Interval Card",
  component: IntervalCard,
} as ComponentMeta<typeof IntervalCard>;

const date = "2022-04-01";

const hourInterval = {
  startTime: "09:00",
  endTime: "10:00",
};

const baseSlot = {
  date,
  type: SlotType.Ice,
  interval: hourInterval,
  notes: "Rink 1",
};

const hourAndHalfInterval = {
  startTime: "09:00",
  endTime: "10:30",
};

const twoHourInterval = {
  startTime: "09:00",
  endTime: "11:00",
};

const longInterval = {
  startTime: "09:00",
  endTime: "11:10",
};

export const Sizes = (): JSX.Element => (
  <>
    <StorybookGrid cols={2}>
      <StorybookItem height={240} label="Duration: 1h">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Active}
        />
      </StorybookItem>
      <StorybookItem height={240} label="Duration: 1.5h">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Active}
          interval={hourAndHalfInterval}
        />
      </StorybookItem>
      <StorybookItem height={240} label="Duration: 2h">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Active}
          interval={twoHourInterval}
        />
      </StorybookItem>
      <StorybookItem height={240} label="Duration: 2h+">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Active}
          interval={longInterval}
        />
      </StorybookItem>
    </StorybookGrid>
  </>
);

export const Variants = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Type: Ice</h1>
    <StorybookGrid className="mb-8" cols={3}>
      <StorybookItem height={240} label="Book">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Active}
        />
      </StorybookItem>
      <StorybookItem height={240} label="Calendar">
        <IntervalCard {...baseSlot} variant={IntervalCardVariant.Calendar} />
      </StorybookItem>
      <StorybookItem height={240} label="Simple">
        <IntervalCard {...baseSlot} variant={IntervalCardVariant.Simple} />
      </StorybookItem>
    </StorybookGrid>
    <h1 className="text-lg font-bold mb-4">Type: Off Ice</h1>
    <StorybookGrid cols={3}>
      <StorybookItem height={240} label="Book">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Active}
          type={SlotType.OffIce}
        />
      </StorybookItem>
      <StorybookItem height={240} label="Calendar">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Calendar}
          type={SlotType.OffIce}
        />
      </StorybookItem>
      <StorybookItem height={240} label="Simple">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Simple}
          type={SlotType.OffIce}
        />
      </StorybookItem>
    </StorybookGrid>
  </>
);

export const States = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Type: Ice</h1>
    <StorybookGrid className="mb-8" cols={4}>
      <StorybookItem height={160} label="Default">
        <IntervalCard
          variant={IntervalCardVariant.Booking}
          {...baseSlot}
          state={IntervalCardState.Default}
        />
      </StorybookItem>
      <StorybookItem height={160} label="Active">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Active}
        />
      </StorybookItem>
      <StorybookItem height={160} label="Disabled">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Disabled}
        />
      </StorybookItem>
    </StorybookGrid>
    <h1 className="text-lg font-bold mb-4">Type: Off Ice</h1>
    <StorybookGrid cols={4}>
      <StorybookItem height={160} label="Default">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Default}
          type={SlotType.OffIce}
        />
      </StorybookItem>
      <StorybookItem height={160} label="Active">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Active}
          type={SlotType.OffIce}
        />
      </StorybookItem>
      <StorybookItem height={160} label="Disabled">
        <IntervalCard
          {...baseSlot}
          variant={IntervalCardVariant.Booking}
          state={IntervalCardState.Disabled}
          type={SlotType.OffIce}
        />
      </StorybookItem>
    </StorybookGrid>
  </>
);

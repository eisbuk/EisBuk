import React from "react";
import { ComponentMeta } from "@storybook/react";

import { SlotType } from "@eisbuk/shared";

import IntervalCard, {
  IntervalCardState,
  IntervalCardVariant,
} from "./IntervalCard";
import { StorybookGrid, StorybookItem } from "src/utils/storybook";

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
};

const hourAndHalfInterval = {
  startTime: "09:00",
  endTime: "10:30",
};

const twoHourInterval = {
  startTime: "09:00",
  endTime: "11:00",
};

export const Sizes = (): JSX.Element => (
  <>
    <StorybookGrid cols={3}>
      <StorybookItem label="Duration: 1h">
        <IntervalCard {...baseSlot} />
      </StorybookItem>
      <StorybookItem label="Duration: 1.5h">
        <IntervalCard {...baseSlot} interval={hourAndHalfInterval} />
      </StorybookItem>
      <StorybookItem label="Duration: 2h">
        <IntervalCard {...baseSlot} interval={twoHourInterval} />
      </StorybookItem>
    </StorybookGrid>
  </>
);

export const Variants = (): JSX.Element => (
  <>
    <StorybookGrid cols={3}>
      <StorybookItem label="Book">
        <IntervalCard {...baseSlot} state={IntervalCardState.Active} />
      </StorybookItem>
      <StorybookItem label="Calendar">
        <IntervalCard {...baseSlot} variant={IntervalCardVariant.Calendar} />
      </StorybookItem>
      <StorybookItem label="Simple">
        <IntervalCard {...baseSlot} variant={IntervalCardVariant.Simple} />
      </StorybookItem>
    </StorybookGrid>
  </>
);

export const States = (): JSX.Element => (
  <>
    <StorybookGrid cols={4}>
      <StorybookItem label="Default">
        <IntervalCard {...baseSlot} state={IntervalCardState.Default} />
      </StorybookItem>
      <StorybookItem label="Active">
        <IntervalCard {...baseSlot} state={IntervalCardState.Active} />
      </StorybookItem>
      <StorybookItem label="Faded">
        <IntervalCard {...baseSlot} state={IntervalCardState.Faded} />
      </StorybookItem>
      <StorybookItem label="Disabled">
        <IntervalCard {...baseSlot} state={IntervalCardState.Disabled} />
      </StorybookItem>
    </StorybookGrid>
  </>
);

export const Types = (): JSX.Element => (
  <>
    <StorybookGrid cols={3}>
      <StorybookItem label="Type: Ice">
        <IntervalCard {...baseSlot} />
      </StorybookItem>
      <StorybookItem label="Type: Off Ice">
        <IntervalCard {...baseSlot} type={SlotType.OffIce} />
      </StorybookItem>
    </StorybookGrid>
  </>
);

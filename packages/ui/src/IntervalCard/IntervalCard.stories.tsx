import React from "react";
import { ComponentMeta } from "@storybook/react";

import { SlotType } from "@eisbuk/shared";

import IntervalCard, {
  IntervalCardState,
  IntervalCardVariant,
} from "./IntervalCard";
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
    <StorybookGrid cols={2}>
      <StorybookItem height={240} label="Duration: 1h">
        <IntervalCard {...baseSlot} />
      </StorybookItem>
      <StorybookItem height={240} label="Duration: 1.5h">
        <IntervalCard {...baseSlot} interval={hourAndHalfInterval} />
      </StorybookItem>
      <StorybookItem height={240} label="Duration: 2h">
        <IntervalCard {...baseSlot} interval={twoHourInterval} />
      </StorybookItem>
    </StorybookGrid>
  </>
);

export const Variants = (): JSX.Element => (
  <>
    <StorybookGrid cols={3}>
      <StorybookItem height={240} label="Book">
        <IntervalCard {...baseSlot} state={IntervalCardState.Active} />
      </StorybookItem>
      <StorybookItem height={240} label="Calendar">
        <IntervalCard {...baseSlot} variant={IntervalCardVariant.Calendar} />
      </StorybookItem>
      <StorybookItem height={240} label="Simple">
        <IntervalCard {...baseSlot} variant={IntervalCardVariant.Simple} />
      </StorybookItem>
    </StorybookGrid>
    <StorybookGrid cols={3}>
      <StorybookItem height={240} label="Book">
        <IntervalCard
          {...baseSlot}
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
    <StorybookGrid cols={4}>
      <StorybookItem height={160} label="Default">
        <IntervalCard {...baseSlot} state={IntervalCardState.Default} />
      </StorybookItem>
      <StorybookItem height={160} label="Active">
        <IntervalCard {...baseSlot} state={IntervalCardState.Active} />
      </StorybookItem>
      <StorybookItem height={160} label="Faded">
        <IntervalCard {...baseSlot} state={IntervalCardState.Faded} />
      </StorybookItem>
      <StorybookItem height={160} label="Disabled">
        <IntervalCard {...baseSlot} state={IntervalCardState.Disabled} />
      </StorybookItem>
    </StorybookGrid>
  </>
);

export const Types = (): JSX.Element => (
  <>
    <StorybookGrid cols={3}>
      <StorybookItem height={160} label="Type: Ice">
        <IntervalCard {...baseSlot} state={IntervalCardState.Active} />
      </StorybookItem>
      <StorybookItem height={160} label="Type: Off Ice">
        <IntervalCard
          {...baseSlot}
          type={SlotType.OffIce}
          state={IntervalCardState.Active}
        />
      </StorybookItem>
    </StorybookGrid>
  </>
);

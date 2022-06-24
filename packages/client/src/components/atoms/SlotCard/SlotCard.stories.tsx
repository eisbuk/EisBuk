import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import { SlotInterface } from "@eisbuk/shared";

import SlotCard from "./SlotCard";

import { baseSlot, createIntervals } from "@/__testData__/slots";

/**
 * Decorator used to prevent slots diaplayed from stratching to full width
 */
const decorators: ComponentMeta<typeof SlotCard>["decorators"] = [
  (Story) => (
    <div style={{ maxWidth: 500 }}>
      <Story />
    </div>
  ),
];

export default {
  title: "Slot Card",
  component: SlotCard,
  decorators,
} as ComponentMeta<typeof SlotCard>;

export const Default = (): JSX.Element => (
  <SlotCard {...baseSlot} notes="Pista 1" />
);

const adminViewWithActionButtonsProps = { enableEdit: true };
export const AdminViewWithActionButtons = (): JSX.Element => (
  <SlotCard {...baseSlot} {...adminViewWithActionButtonsProps} />
);

const aBunchOfIntervals: SlotInterface = {
  ...baseSlot,
  intervals: { ...baseSlot.intervals, ...createIntervals(11) },
};

export const ABunchOfIntervalsWithActionButtons = (): JSX.Element => (
  <SlotCard {...aBunchOfIntervals} {...adminViewWithActionButtonsProps} />
);

export const Selected = (): JSX.Element => {
  // we're using state here to keep things simple and test onClick functionality
  const [selected, setSelected] = useState(true);
  return (
    <SlotCard
      {...baseSlot}
      enableEdit
      selected={selected}
      onClick={() => setSelected(!selected)}
    />
  );
};

import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import { SlotInterface } from "@eisbuk/shared";

import SlotCard from "./SlotCard";

import { baseSlot } from "@/__testData__/slots";

/**
 * Decorator used to prevent slots diaplayed from stratching to full width
 */
const decorators: ComponentMeta<typeof SlotCard>["decorators"] = [
  (Story) => (
    <div style={{ width: 500 }}>
      <Story />
    </div>
  ),
];

export default {
  title: "Slot Card",
  component: SlotCard,
  decorators,
} as ComponentMeta<typeof SlotCard>;

const baseProps: SlotInterface = {
  ...baseSlot,
};

export const Default = (): JSX.Element => (
  <SlotCard {...baseProps} notes="Pista 1" />
);

const adminViewWithActionButtonsProps = { enableEdit: true };
export const AdminViewWithActionButtons = (): JSX.Element => (
  <SlotCard {...baseProps} {...adminViewWithActionButtonsProps} />
);

export const Selected = (): JSX.Element => {
  // we're using state here to keep things simple and test onClick functionality
  const [selected, setSelected] = useState(true);
  return (
    <SlotCard
      {...baseProps}
      enableEdit
      selected={selected}
      onClick={() => setSelected(!selected)}
    />
  );
};

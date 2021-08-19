import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import { Duration } from "eisbuk-shared";

import { SlotView } from "@/enums/components";

import SlotCard from "./SlotCard";

import { dummySlot } from "./__testData__";

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

const baseProps = {
  ...dummySlot,
  view: SlotView.Admin,
};

export const AdminView = (): JSX.Element => <SlotCard {...baseProps} />;

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

const customerViewProps = { view: SlotView.Customer };
export const CustomerView = (): JSX.Element => (
  <SlotCard {...baseProps} {...customerViewProps} />
);

const customerViewWithBookedDurationProps = {
  view: SlotView.Customer,
  subscribedDuration: Duration["1.5h"],
};
export const CustomerViewWithBookedDuration = (): JSX.Element => (
  <SlotCard {...baseProps} {...customerViewWithBookedDurationProps} />
);

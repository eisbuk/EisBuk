import React from "react";
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
  title: "Slot",
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

const selectedProps = { enableEdit: true, selected: true };
export const Selected = (): JSX.Element => (
  <SlotCard {...baseProps} {...selectedProps} />
);

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

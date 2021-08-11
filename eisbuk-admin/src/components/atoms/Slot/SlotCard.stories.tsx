import React from "react";
import {
  ComponentMeta,
  // ComponentStory
} from "@storybook/react";
import { DateTime } from "luxon";

import { Duration, SlotType, Category } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import { SlotView } from "@/enums/components";

import SlotCard, { SlotCardProps } from "./SlotCard";

import { luxonToFB } from "@/utils/date";

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

const baseProps: SlotCardProps = {
  date: luxonToFB(DateTime.fromISO(__storybookDate__!).plus({ hours: 8 })),
  id: "id",
  durations: [Duration["1h"], Duration["1.5h"], Duration["2h"]],
  type: SlotType.Ice,
  categories: [Category.PreCompetitive],
  notes: "",
  view: SlotView.Admin,
};

// const Template: ComponentStory<typeof SlotCard> = (args) => (
//   <SlotCard {...baseProps} {...args} />
// );

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

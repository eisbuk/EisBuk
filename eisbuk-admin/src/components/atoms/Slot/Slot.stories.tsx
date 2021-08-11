import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { DateTime } from "luxon";

import { Duration, SlotType, Category } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import { SlotView } from "@/enums/components";

import SlotCard, { SlotCardProps } from "./Slot";

import { luxonToFB } from "@/utils/date";

export default {
  title: "Slot",
  component: SlotCard,
} as ComponentMeta<typeof SlotCard>;

const baseProps: SlotCardProps = {
  date: luxonToFB(DateTime.fromISO(__storybookDate__!)),
  id: "id",
  durations: Object.values(Duration),
  type: SlotType.Ice,
  categories: [Category.PreCompetitive],
  notes: "",
  enableEdit: false,
  view: SlotView.Admin,
};

const Template: ComponentStory<typeof SlotCard> = (args) => (
  <SlotCard {...baseProps} {...args} />
);

export const Default = Template.bind({});
Template.args = {};

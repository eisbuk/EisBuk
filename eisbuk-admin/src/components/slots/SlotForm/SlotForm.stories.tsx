import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { DateTime } from "luxon";

import { Category, Duration, SlotType } from "eisbuk-shared";

import NewSlotForm from "@/components/slots/SlotForm";

import { luxonToFB } from "@/utils/date";

export default {
  title: "SlotForm",
  component: NewSlotForm,
  argTypes: {
    editSlot: { action: "udpated" },
    createSlot: { action: "created" },
    onClose: { action: "closed" },
    onOpen: { action: "opened" },
  },
} as ComponentMeta<typeof NewSlotForm>;

const baseProps = {
  open: true,
  isoDate: "2021-01-15",
};

const Template: ComponentStory<typeof NewSlotForm> = (args) => (
  <NewSlotForm {...args} />
);

export const EmptyForm = Template.bind({});
EmptyForm.args = {
  ...baseProps,
};

const date = luxonToFB(DateTime.fromISO("2021-01-01").plus({ hours: 8 }));

export const FormWithValues = Template.bind({});
FormWithValues.args = {
  ...baseProps,
  slotToEdit: {
    id: "random_id",
    date,
    categories: [Category.PreCompetitive],
    durations: [Duration["1h"], Duration["2h"]],
    type: SlotType.Ice,
    notes: "Here are some notes\nWith two lines",
  },
};

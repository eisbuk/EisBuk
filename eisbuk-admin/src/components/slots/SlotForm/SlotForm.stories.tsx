import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import firebase from "firebase";

import SlotForm from "@/components/slots/SlotForm";
import { Category, Duration, SlotType } from "@functions/enums/firestore";

export default {
  title: "SlotForm",
  component: SlotForm,
  argTypes: {
    editSlot: { action: "udpated" },
    createSlot: { action: "created" },
    onClose: { action: "closed" },
    onOpen: { action: "opened" },
  },
} as ComponentMeta<typeof SlotForm>;

const baseProps = {
  open: true,
  isoDate: "2021-01-15",
};

const Template: ComponentStory<typeof SlotForm> = (args) => (
  <SlotForm {...args} />
);

export const EmptyForm = Template.bind({});
EmptyForm.args = {
  ...baseProps,
};

export const FormWithValues = Template.bind({});
FormWithValues.args = {
  ...baseProps,
  slotToEdit: {
    id: "random_id",
    date: firebase.firestore.Timestamp.now(),
    time: "11:30",
    categories: [Category.PreCompetitive],
    durations: [Duration["1h"], Duration["2h"]],
    type: SlotType.Ice,
    notes: "Here are some notes\nWith two lines" as any,
  },
};

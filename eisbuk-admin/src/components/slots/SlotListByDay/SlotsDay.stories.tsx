import React from "react";
import firebase from "firebase";
import { v4 } from "uuid";

import SlotsDay from "@/components/slots/SlotListByDay/SlotsDay";

import { Category, Duration, Notes, SlotType } from "@/enums/firestore";
import { ComponentStory } from "@storybook/react";

export default {
  title: "Slots Day",
  component: SlotsDay,
};

const Timestamp = firebase.firestore.Timestamp;

const uuid = v4;

const baseProps = {
  day: "2021-01-15",
  view: "slots",
};

const slots = {
  foo: {
    id: uuid(),
    categories: [Category.Agonismo, Category.Preagonismo],
    type: SlotType.Ice,
    date: new Timestamp(1609513200, 0),
    durations: [Duration["1h"]],
    notes: Notes.Pista1,
  },
  bar: {
    id: uuid(),
    date: new Timestamp(1609495200, 0),
    categories: [Category.Preagonismo, Category.Agonismo, Category.Corso],
    type: SlotType.OffIceDanza,
    durations: [Duration["1.5h"], Duration["2h"]],
    notes: Notes.Pista2,
  },
  baz: {
    id: uuid(),
    date: new Timestamp(1609516800, 0),
    categories: [Category.Corso],
    type: SlotType.OffIceGym,
    durations: Object.values(Duration),
    notes: Notes.Pista2, // this was deleted `\nPotrebbe non svolgersi`
  },
};

const Template: ComponentStory<typeof SlotsDay> = (
  args: Omit<Omit<Parameters<typeof SlotsDay>[0], "day">, "view">
) => <SlotsDay {...baseProps} {...args} />;

export const EmptyDay = Template.bind({});

export const OneSlot = Template.bind({});
OneSlot.args = {
  slots: { foo: slots.foo },
};

export const ManySlots = Template.bind({});
ManySlots.args = {
  slots,
};

export const ManySlotsWithEdit = Template.bind({});
ManySlotsWithEdit.args = {
  slots,
  enableEdit: true,
};

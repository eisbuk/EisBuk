import React from "react";
import { Timestamp } from "@google-cloud/firestore";
import { v4 } from "uuid";

import SlotsDay from "./SlotsDay";

import { Category, Duration, Notes, SlotType } from "@/enums/firestore";

export default {
  title: "Slots Day",
  component: SlotsDay,
};

const uuid = v4;

const baseProps = {
  day: "2021-01-15",
  view: "slots",
};

const multipleSlotProps = {
  slots: {
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
  },
};

export const ManySlots = (): JSX.Element => (
  <SlotsDay {...baseProps} {...multipleSlotProps} />
);

export const ManySlotsWithDelete = (): JSX.Element => (
  <SlotsDay {...baseProps} {...multipleSlotProps} enableEdit />
);

export const OneSlot = (): JSX.Element => (
  <SlotsDay {...baseProps} slots={{ slots: multipleSlotProps.slots.foo }} />
);

export const EmptyDay = (): JSX.Element => (
  <SlotsDay {...baseProps} slots={{}} />
);

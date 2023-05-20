import React from "react";
import { ComponentMeta } from "@storybook/react";

import { SlotType } from "@eisbuk/shared";

import { baseSlot } from "@eisbuk/testing/slots";
import { testDate } from "@eisbuk/testing/date";

import SlotForm from "./SlotForm";

export default {
  title: "Slot Form",
  component: SlotForm,
} as ComponentMeta<typeof SlotForm>;

export const Default = (): JSX.Element => (
  <SlotForm
    className="max-w-[720px] h-full max-h-[90vh] mx-auto shadow-lg rounded border border-cyan-700"
    date={testDate}
    onClose={() => {}}
    onSubmit={() => {}}
  />
);

export const EditForm = (): JSX.Element => (
  <SlotForm
    className="max-w-[720px] h-full max-h-[90vh] mx-auto shadow-lg rounded border border-cyan-700"
    date={testDate}
    onClose={() => {}}
    onSubmit={() => {}}
    slotToEdit={baseSlot}
  />
);

export const EditFormOffIce = (): JSX.Element => (
  <SlotForm
    className="max-w-[720px] h-full max-h-[90vh] mx-auto shadow-lg rounded border border-cyan-700"
    date={testDate}
    onClose={() => {}}
    onSubmit={() => {}}
    slotToEdit={{ ...baseSlot, type: SlotType.OffIce }}
  />
);

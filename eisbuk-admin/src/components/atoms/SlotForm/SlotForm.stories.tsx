import React from "react";

import { SlotType } from "eisbuk-shared";

import SlotForm from "./SlotForm";

import { baseSlot } from "@/__testData__/slots";
import { testDate } from "@/__testData__/date";

export default {
  title: "Slot Form",
  component: SlotForm,
};

export const Default = (): JSX.Element => (
  <SlotForm date={testDate} onClose={() => {}} open />
);

export const EditForm = (): JSX.Element => (
  <SlotForm date={testDate} onClose={() => {}} slotToEdit={baseSlot} open />
);

export const EditFormOffIce = (): JSX.Element => (
  <SlotForm
    date={testDate}
    onClose={() => {}}
    slotToEdit={{ ...baseSlot, type: SlotType.OffIceDancing }}
    open
  />
);

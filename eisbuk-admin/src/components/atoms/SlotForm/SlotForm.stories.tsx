import { DateTime } from "luxon";
import React from "react";

import { SlotType } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import SlotForm from "./SlotForm";

import { dummySlot } from "./__testData__/dummyData";

export default {
  title: "Slot Form",
  component: SlotForm,
};

export const Default = (): JSX.Element => (
  <SlotForm
    date={DateTime.fromISO(__storybookDate__)}
    onClose={() => {}}
    open
  />
);

export const EditForm = (): JSX.Element => (
  <SlotForm
    date={DateTime.fromISO(__storybookDate__)}
    onClose={() => {}}
    slotToEdit={dummySlot}
    open
  />
);

export const EditFormOffIce = (): JSX.Element => (
  <SlotForm
    date={DateTime.fromISO(__storybookDate__)}
    onClose={() => {}}
    slotToEdit={{ ...dummySlot, type: SlotType.OffIceDancing }}
    open
  />
);

import React from "react";
import { ComponentMeta } from "@storybook/react";

import { SlotType } from "@eisbuk/shared";

import SlotForm from "./SlotForm";
import { ModalContainer } from "@/features/modal/components";

import { baseSlot } from "@/__testData__/slots";
import { testDate } from "@/__testData__/date";

export default {
  title: "Slot Form",
  component: SlotForm,
  decorators: [
    (Story) => (
      <ModalContainer>
        <Story />
      </ModalContainer>
    ),
  ],
} as ComponentMeta<typeof SlotForm>;

export const Default = (): JSX.Element => (
  <SlotForm date={testDate} onClose={() => {}} />
);

export const EditForm = (): JSX.Element => (
  <SlotForm date={testDate} onClose={() => {}} slotToEdit={baseSlot} />
);

export const EditFormOffIce = (): JSX.Element => (
  <SlotForm
    date={testDate}
    onClose={() => {}}
    slotToEdit={{ ...baseSlot, type: SlotType.OffIce }}
  />
);

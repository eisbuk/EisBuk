import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons from "./SlotOperationButtons";
import NewSlotButton from "./NewSlotButton";
import EditSlotButton from "./EditSlotButton";
import CopyButton from "./CopyButton";
import PasteButton from "./PasteButton";
import DeleteButton from "./DeleteButton";

import { __storybookDate__ } from "@/lib/constants";

import { baseSlot } from "@eisbuk/testing/slots";

export default {
  title: "Slot Operation Buttons",
  component: SlotOperationButtons,
} as ComponentMeta<typeof SlotOperationButtons>;

const baseProps = {
  date: DateTime.fromISO(__storybookDate__),
  slot: baseSlot,
  slotsToCopy: {
    [ButtonContextType.Day]: true,
    [ButtonContextType.Week]: true,
  },
};

// #region allButtonsPerContextType
export const AllSlotIcons = (): JSX.Element => (
  <SlotOperationButtons {...baseProps} contextType={ButtonContextType.Slot}>
    <EditSlotButton />
    <DeleteButton />
  </SlotOperationButtons>
);

export const AllDayIcons = (): JSX.Element => (
  <SlotOperationButtons {...baseProps} contextType={ButtonContextType.Day}>
    <NewSlotButton />
    <CopyButton />
    <PasteButton />
    <DeleteButton />
  </SlotOperationButtons>
);

export const AllWeekIcons = (): JSX.Element => (
  <SlotOperationButtons {...baseProps}>
    <CopyButton />
    <PasteButton />
    <DeleteButton />
  </SlotOperationButtons>
);
// #endregion allButtonsPerContextType

// #region buttonVariants
export const CopyVariants = (): JSX.Element => (
  <>
    Default:
    <SlotOperationButtons {...baseProps} slotsToCopy={undefined}>
      <CopyButton />
    </SlotOperationButtons>
    With Slots in clipboard:
    <SlotOperationButtons {...baseProps}>
      <CopyButton />
    </SlotOperationButtons>
  </>
);

export const DisabledPaste = (): JSX.Element => (
  <>
    Default:
    <SlotOperationButtons {...baseProps}>
      <PasteButton />
    </SlotOperationButtons>
    Disabled:
    <SlotOperationButtons {...baseProps} slotsToCopy={undefined}>
      <PasteButton />
    </SlotOperationButtons>
  </>
);

export const deleteWithDialog = (): JSX.Element => (
  <SlotOperationButtons {...baseProps}>
    <DeleteButton />
  </SlotOperationButtons>
);
// #endregion buttonVariants

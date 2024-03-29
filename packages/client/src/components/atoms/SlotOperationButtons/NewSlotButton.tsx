import React, { useContext } from "react";

import { useTranslation, SlotsAria } from "@eisbuk/translations";
import { PlusCircle } from "@eisbuk/svg";

import { testId } from "@eisbuk/testing/testIds";

import { ButtonContextType } from "@/enums/components";

import { ButtonGroupContext } from "./SlotOperationButtons";
import SlotOperationButton from "./SlotOperationButton";

import {
  __slotButtonNoContextError,
  __noDateProvidedError,
  __newSlotButtonWrongContextError,
} from "@/lib/errorMessages";

import { createModal } from "@/features/modal/useModal";

/**
 * Button to create a new slot. Opens up a blank SlotForm 'onClick' to
 * futher submit the creation of the new slot to the db.
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - no value for `date` has been provided in the context (as it is needed for full functionality)
 */
export const NewSlotButton: React.FC = () => {
  const buttonGroupContext = useContext(ButtonGroupContext);

  const { t } = useTranslation();

  const { openWithProps: openSlotForm } = useSlotFormModal();

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotOpeartionButtons` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { contextType, date, disabled } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if trying to render under any context other than `day`
  // this is because adding a new slot on `SlotCard` doesn't make much sense
  // and calling create slot on `week`'s view would not be precise enough (in terms of date the slot belongs to)
  if (contextType !== ButtonContextType.Day) {
    console.error(__newSlotButtonWrongContextError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if no `date` param provided within the context
  if (!date) {
    console.error(__noDateProvidedError);
    return null;
  }

  const openForm = (e: React.SyntheticEvent) => {
    e.preventDefault();
    openSlotForm({
      date: date!.toISODate(),
    });
  };

  return (
    <SlotOperationButton
      onClick={openForm}
      data-testid={testId("new-slot-button")}
      aria-label={t(SlotsAria.CreateSlot, { date })}
      disabled={disabled}
    >
      <PlusCircle />
    </SlotOperationButton>
  );
};

const useSlotFormModal = createModal("SlotFormDialog");

export default NewSlotButton;

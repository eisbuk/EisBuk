import React, { useContext } from "react";
import { useSelector } from "react-redux";

import { Pencil } from "@eisbuk/svg";

import { testId } from "@eisbuk/testing/testIds";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButton from "./SlotOperationButton";

import { ButtonGroupContext } from "./SlotOperationButtons";

import { createModal } from "@/features/modal/useModal";

import { LocalStore } from "@/types/store";

import {
  __editSlotButtonWrongContextError,
  __noSlotProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

/**
 * Button to edit an existing slot.
 * Opens up a SlotForm with current `slot` from context passed as `slotToEdit`.
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - not within `contextType = "slot"` as it's functionality handles only this scenario
 * - no value for `slot` has been provided within the context (as it is needed for full functionality)
 */
export const EditSlotButton: React.FC = () => {
  const buttonGroupContext = useContext(ButtonGroupContext);
  const slotAttendances = useSelector((state: LocalStore) =>
    state.firestore.data.attendance && buttonGroupContext?.slot?.id
      ? state.firestore.data.attendance[buttonGroupContext.slot.id].attendances
      : {}
  );

  const { openWithProps: openDeleteIntervalDisabledDialog } =
    useDeleteIntervalDisabledModal();

  const { openWithProps: openSlotForm } = useSlotFormModal();

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotOperationButtons` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { slot, contextType, disabled } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if no `slot` param provided within the context
  if (!slot) {
    console.error(__noSlotProvidedError);
    return null;
  }

  const openForm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    openSlotForm({
      date: slot.date,
      slotToEdit: slot,
      slotAttendances,
      openDeleteIntervalDisabledDialog,
    });
  };

  // prevent component from rendering and log error to console (but don't throw)
  // if `contextType` is any other than "slot"
  if (contextType !== ButtonContextType.Slot) {
    console.error(__editSlotButtonWrongContextError);
    return null;
  }

  return (
    <SlotOperationButton
      onClick={openForm}
      data-testid={testId("edit-slot-button")}
      disabled={disabled}
    >
      <Pencil />
    </SlotOperationButton>
  );
};

const useSlotFormModal = createModal("SlotFormDialog");
const useDeleteIntervalDisabledModal = createModal(
  "DeleteIntervalDisabledDialog"
);

export default EditSlotButton;

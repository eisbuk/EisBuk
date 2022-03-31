import React, { useState, useContext } from "react";

import IconButton from "@mui/material/IconButton";

import CreateIcon from "@mui/icons-material/Create";

import { ButtonContextType } from "@/enums/components";

import { SlotButtonProps } from "@/types/components";

import SlotForm from "@/components/atoms/SlotForm";
import { ButtonGroupContext } from "./SlotOperationButtons";

import {
  __editSlotButtonWrongContextError,
  __noSlotProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { __editSlotButtonId__ } from "@/__testData__/testIds";

/**
 * Button to edit an existing slot.
 * Opens up a SlotForm with current `slot` from context passed as `slotToEdit`.
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - not within `contextType = "slot"` as it's functionality handles only this scenario
 * - no value for `slot` has been provided within the context (as it is needed for full functionality)
 */
export const EditSlotButton: React.FC<SlotButtonProps> = ({ size }) => {
  const buttonGroupContext = useContext(ButtonGroupContext);

  const [openForm, setOpenForm] = useState(false);

  const showForm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setOpenForm(true);
  };
  const closeForm = () => setOpenForm(false);

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotOperationButtons` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { slot, iconSize, contextType } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if no `slot` param provided within the context
  if (!slot) {
    console.error(__noSlotProvidedError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if `contextType` is any other than "slot"
  if (contextType !== ButtonContextType.Slot) {
    console.error(__editSlotButtonWrongContextError);
    return null;
  }

  return (
    <>
      <IconButton
        size={size || iconSize}
        onClick={showForm}
        data-testid={__editSlotButtonId__}
      >
        <CreateIcon />
      </IconButton>
      <SlotForm
        open={openForm}
        slotToEdit={buttonGroupContext.slot}
        onClose={closeForm}
        date={slot.date}
      />
    </>
  );
};

export default EditSlotButton;

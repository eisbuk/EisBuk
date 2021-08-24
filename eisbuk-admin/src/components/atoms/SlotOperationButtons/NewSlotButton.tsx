import React, { useState, useContext } from "react";
import { useDispatch } from "react-redux";

import IconButton from "@material-ui/core/IconButton";

import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";

import { ButtonContextType } from "@/enums/components";

import { SlotOperation } from "@/types/slotOperations";

import SlotForm from "@/components/slots/SlotForm";
import { ButtonGroupContext } from "./SlotOperationButtons";

import { createSlots } from "@/store/actions/slotOperations";

import {
  __newSlotButtonWrongContextError,
  __noDateProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { __newSlotButtonId__ } from "./__testData__/testIds";

/**
 * Button to create a new slot. Opens up a blank SlotForm 'onClick'.
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - no value for `date` has been provided in the context (as it is needed for full functionality)
 */
export const NewSlotButton: React.FC = () => {
  const buttonGroupContext = useContext(ButtonGroupContext);

  const [openForm, setOpenForm] = useState(false);

  const showForm = () => setOpenForm(true);
  const closeForm = () => setOpenForm(false);

  /** @TEMP This should be handled within the `SlotForm` component */
  const dispatch = useDispatch();
  const onCreateSlot: SlotOperation<"create"> = (slot) => {
    dispatch(createSlots([slot]));
  };
  /** @TEMP */

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within of `ButtonGroupContext`
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if trying to render under any context other than `day`
  // this is because adding a new slot on `SlotCard` doesn't make much sense
  // and calling create slot on `week`'s view would not be precise enough (in terms of date)
  if (buttonGroupContext.contextType !== ButtonContextType.Day) {
    console.error(__newSlotButtonWrongContextError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if not `date` param not provided within the context
  if (!buttonGroupContext.date) {
    console.error(__noDateProvidedError);
    return null;
  }

  return (
    <>
      <IconButton
        size="small"
        onClick={showForm}
        data-testid={__newSlotButtonId__}
      >
        <AddCircleOutlineIcon />
      </IconButton>
      <SlotForm open={openForm} onClose={closeForm} createSlot={onCreateSlot} />
    </>
  );
};

export default NewSlotButton;

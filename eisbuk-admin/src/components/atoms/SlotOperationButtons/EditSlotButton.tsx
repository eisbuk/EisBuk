import React, { useState, useContext } from "react";
import { useDispatch } from "react-redux";

import IconButton from "@material-ui/core/IconButton";

import CreateIcon from "@material-ui/icons/Create";

import { ButtonContextType } from "@/enums/components";

import { SlotOperation } from "@/types/slotOperations";

import SlotForm from "@/components/slots/SlotForm";
import { ButtonGroupContext } from "./SlotOperationButtons";

import {
  __editSlotButtonWrongContextError,
  __noSlotProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { editSlot } from "@/store/actions/slotOperations";

import { __editSlotButtonId__ } from "./__testData__/testIds";

/**
 * Button to edit an existing slot. Opens up a SlotForm (with current slot context passed as `slotToEdit`) 'onClick'.
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - `contextType` of ButtonGroupContext is anything other than `slot` (as it only has functionality to handle this scenario)
 * - no value for `slot` has been provided in the context (as it is needed for full functionality)
 */
export const EditSlotButton: React.FC = () => {
  const buttonGroupContext = useContext(ButtonGroupContext);

  const [openForm, setOpenForm] = useState(false);

  const showForm = () => setOpenForm(true);
  const closeForm = () => setOpenForm(false);

  /** @TEMP This should be handled within the `SlotForm` component */
  const dispatch = useDispatch();
  const onEditSlot: SlotOperation = (slot) => {
    dispatch(editSlot(slot));
  };
  /** @TEMP */

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within of `ButtonGroupContext`
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if `slot` param not provided within the context
  if (!buttonGroupContext.slot) {
    console.error(__noSlotProvidedError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if copntext any other than 'slot'
  if (buttonGroupContext.contextType !== ButtonContextType.Slot) {
    console.error(__editSlotButtonWrongContextError);
    return null;
  }

  return (
    <>
      <IconButton
        size="small"
        onClick={showForm}
        data-testid={__editSlotButtonId__}
      >
        <CreateIcon />
      </IconButton>
      <SlotForm
        open={openForm}
        slotToEdit={buttonGroupContext.slot}
        onClose={closeForm}
        editSlot={onEditSlot}
      />
    </>
  );
};

export default EditSlotButton;

import React, {
  // useState,
  useContext,
} from "react";
// import { useDispatch } from "react-redux";

import IconButton from "@material-ui/core/IconButton";

import CreateIcon from "@material-ui/icons/Create";

import { ButtonContextType } from "@/enums/components";

import { SlotButtonProps } from "@/types/components";
// import { SlotOperation } from "@/types/deprecated/slotOperations";

// import SlotForm from "@/components/temp/NewSlotForm/SlotForm";
import { ButtonGroupContext } from "./SlotOperationButtons";

import {
  __editSlotButtonWrongContextError,
  __noSlotProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

// import { editSlot } from "@/store/actions/slotOperations";

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

  // const [openForm, setOpenForm] = useState(false);

  // const showForm = () => setOpenForm(true);
  // const closeForm = () => setOpenForm(false);

  /** @TEMP This should be handled within the `SlotForm` component */
  // const dispatch = useDispatch();
  // const onEditSlot: SlotOperation = (slot) => {
  //   dispatch(editSlot(slot));
  // };
  /** @TEMP */

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
        // onClick={showForm}
        data-testid={__editSlotButtonId__}
      >
        <CreateIcon />
      </IconButton>
      {/* <SlotForm
        open={openForm}
        slotToEdit={buttonGroupContext.slot}
        onClose={closeForm}
        // editSlot={onEditSlot}
      /> */}
    </>
  );
};

export default EditSlotButton;

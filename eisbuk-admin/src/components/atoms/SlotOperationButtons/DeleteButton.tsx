import React, { useContext, useState } from "react";
import { useDispatch } from "react-redux";

import IconButton from "@material-ui/core/IconButton";

import DeleteIcon from "@material-ui/icons/Delete";

import { ButtonContextType } from "@/enums/components";

import { SlotButtonProps } from "@/types/components";

import { ButtonGroupContext } from "./SlotOperationButtons";
import ConfirmDialog from "@/components/global/ConfirmDialog";

import {
  deleteSlot,
  deleteSlotsDay,
  deleteSlotsWeek,
} from "@/store/actions/slotOperations";

import {
  __noDateDelete,
  __noSlotToDelete,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { __deleteButtonId__ } from "@/__testData__/testIds";

interface Props extends SlotButtonProps {
  /**
   * Optional confirm dialog. Used to open up a confirm dialog before dispatching action to store.
   * Requires title and description (to render the `ConfirmDialog`).
   * If not provided, the action is dispatched to the store directly `onClick`
   */
  confirmDialog?: {
    title: string;
    description: string;
  };
}

/**
 * Button in charge of delete functionality.
 * It dispatches the delete action to the store with respect to `contextType` (`slot`/`day`/`week`).
 * - if no prop for confirm dialog has been provided, the delete action is dispatched immediately `onClick`
 * - if prop for dialog has been passed, the dialog button is opened `onClick` in order to confirm action before dispatching to store
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - under `contextType = "slot"` and no value for `slot` param has been provided within the context
 * - under `contextType = "day" | "week"` and no value for `date` has been provided within the context
 */
export const DeleteButton: React.FC<Props> = ({ size, confirmDialog }) => {
  const dispatch = useDispatch();

  const buttonGroupContext = useContext(ButtonGroupContext);

  // used to control showing of confirmation dialog
  // only used if `confirmDialog` prop has been provided
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotOperationButtons` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { contextType, date, slot, iconSize } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if rendered within `contextType === "slot"` but no value was provided for `slot` within the context
  if (contextType === ButtonContextType.Slot && !slot) {
    console.error(__noSlotToDelete);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if rendered within `contextType === "day" | "week"` but no value was provided for `date` within the context
  if (contextType !== ButtonContextType.Slot && !date) {
    console.error(__noDateDelete);
    return null;
  }

  /**
   * Generic delete handler function.
   * Internally, it decides on the proper store action with respect to `contextType`
   * and dispatches said action to the store
   */
  const handleDelete = () => {
    // choose proper delete function based on `contextType`
    switch (contextType) {
      case ButtonContextType.Slot:
        dispatch(deleteSlot(slot!.id));
        break;

      case ButtonContextType.Day:
        dispatch(deleteSlotsDay(date!));
        break;

      case ButtonContextType.Week:
        dispatch(deleteSlotsWeek(date!));
        break;
    }
  };

  /**
   * Button's `onClick` handler.
   * - If `confirmDialog` prop provided, prompts for confirmation
   * - If no `confirmDialog` prop provided, executes delete immediately
   */
  const handleClick = () => {
    if (confirmDialog) {
      setOpenConfirmDialog(true);
    } else {
      handleDelete();
    }
  };

  return (
    <>
      <IconButton
        size={size || iconSize}
        onClick={handleClick}
        data-testid={__deleteButtonId__}
      >
        <DeleteIcon />
      </IconButton>
      <ConfirmDialog
        title={confirmDialog?.title || ""}
        open={openConfirmDialog}
        setOpen={setOpenConfirmDialog}
        onConfirm={handleDelete}
      >
        {confirmDialog?.description || ""}
      </ConfirmDialog>
    </>
  );
};

export default DeleteButton;

import React, { useContext } from "react";
import { useDispatch } from "react-redux";

import IconButton from "@mui/material/IconButton";

import DeleteIcon from "@mui/icons-material/Delete";

import { ButtonContextType } from "@/enums/components";

import { SlotButtonProps } from "@/types/components";

import { ButtonGroupContext } from "./SlotOperationButtons";

import {
  deleteSlotsDay,
  deleteSlotsWeek,
} from "@/store/actions/slotOperations";

import {
  __noDateDelete,
  __noSlotToDelete,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { __deleteButtonId__ } from "@/__testData__/testIds";
import { openModal } from "@/features/modal/actions";

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
export const DeleteButton: React.FC<SlotButtonProps> = ({ size }) => {
  const dispatch = useDispatch();

  const buttonGroupContext = useContext(ButtonGroupContext);

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
        dispatch(openModal({ component: "DeleteSlotDialog", props: slot! }));
        break;

      case ButtonContextType.Day:
        dispatch(deleteSlotsDay(date!));
        break;

      case ButtonContextType.Week:
        dispatch(deleteSlotsWeek(date!));
        break;
    }
  };

  return (
    <>
      <IconButton
        size={size || iconSize}
        onClick={handleDelete}
        data-testid={__deleteButtonId__}
      >
        <DeleteIcon />
      </IconButton>
    </>
  );
};

export default DeleteButton;

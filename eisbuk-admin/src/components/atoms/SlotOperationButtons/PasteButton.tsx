import React, { useContext } from "react";
import { useDispatch } from "react-redux";

import IconButton from "@material-ui/core/IconButton";

import AssignmentIcon from "@material-ui/icons/Assignment";

import { ButtonContextType } from "@/enums/components";

import { ButtonGroupContext } from "./SlotOperationButtons";

import {
  __slotButtonNoContextError,
  __pasteButtonWrongContextError,
  __noDatePaste,
} from "@/lib/errorMessages";

import { newPasteSlotDay, newPasteSlotWeek } from "@/store/actions/copyPaste";

import { __pasteButtonId__ } from "./__testData__/testIds";

export const PasteButton: React.FC = () => {
  const dispatch = useDispatch();

  const buttonGroupContext = useContext(ButtonGroupContext);

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within of `ButtonGroupContext`
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { date, contextType, slotsToCopy } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if trying to render within `contextType = "slot"`
  // it makes no sence to paste to slot which already exists
  if (contextType === ButtonContextType.Slot) {
    console.error(__pasteButtonWrongContextError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if no param for 'data' has been provided in the context
  if (!date) {
    console.error(__noDatePaste);
    return null;
  }

  // pick the right action creator with respect to `contextType`
  const pasteActionCreator =
    contextType === ButtonContextType.Day ? newPasteSlotDay : newPasteSlotWeek;
  const handlePaste = () => dispatch(pasteActionCreator(date));

  // check if there are slots in clipboard for given `contextType`
  const disableButton = !(slotsToCopy && slotsToCopy[contextType!]);

  return (
    <>
      <IconButton
        size="small"
        onClick={handlePaste}
        disabled={disableButton}
        data-testid={__pasteButtonId__}
      >
        <AssignmentIcon />
      </IconButton>
    </>
  );
};

export default PasteButton;

import React, { useContext } from "react";
import { useDispatch } from "react-redux";

import IconButton from "@material-ui/core/IconButton";
import Badge from "@material-ui/core/Badge";

import FileCopyIcon from "@material-ui/icons/FileCopy";

import { ButtonContextType } from "@/enums/components";

import { ButtonGroupContext } from "./SlotOperationButtons";

import { newCopySlotWeek, newCopySlotDay } from "@/store/actions/copyPaste";

import {
  __slotButtonNoContextError,
  __copyButtonWrongContextError,
  __noDateCopy,
} from "@/lib/errorMessages";

import { __copyButtonId__ } from "./__testData__/testIds";

export const CopyButton: React.FC = () => {
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
  // if we wish to copy slot, we're copying slot(s) from within "day" or "week" context
  if (contextType === ButtonContextType.Slot) {
    console.error(__copyButtonWrongContextError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if no param for 'data' has been provided in the context
  if (!date) {
    console.error(__noDateCopy);
    return null;
  }

  // pick the right action creator with respect to `contextType`
  const copyActionCreator =
    contextType === ButtonContextType.Day ? newCopySlotDay : newCopySlotWeek;
  const onCopy = () => dispatch(copyActionCreator(date));

  // check if there are slots in clipboard for given `contextType`
  const displayBadge = slotsToCopy && slotsToCopy[contextType!];

  return (
    <>
      <IconButton size="small" onClick={onCopy} data-testid={__copyButtonId__}>
        <Badge color="secondary" variant="dot" invisible={!displayBadge}>
          <FileCopyIcon />
        </Badge>
      </IconButton>
    </>
  );
};

export default CopyButton;

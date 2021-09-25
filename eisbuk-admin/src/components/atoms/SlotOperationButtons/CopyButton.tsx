import React, { useContext } from "react";
import { useDispatch } from "react-redux";

import IconButton from "@material-ui/core/IconButton";
import Badge from "@material-ui/core/Badge";

import FileCopyIcon from "@material-ui/icons/FileCopy";

import { ButtonContextType } from "@/enums/components";

import { SlotButtonProps } from "@/types/components";

import { ButtonGroupContext } from "./SlotOperationButtons";

import { copySlotsDay, copySlotsWeek } from "@/store/actions/copyPaste";

import {
  __slotButtonNoContextError,
  __copyButtonWrongContextError,
  __noDateCopy,
} from "@/lib/errorMessages";

import { __copyButtonId__ } from "@/__testData__/testIds";

/**
 * Button to handle copy operation:
 * - if within `"day"` context, copies the whole day of slots (by dispatching `copySlotsDay` to store)
 * - if within `"week"` context, copies the whole day of slots (by dispatching `copySlotsWeek` to store)
 * - the copying of single slots date (within `constexType = "slot"`) is not yet supported
 *   and it makes sense to do it in the future
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - under `contextType = "slot"` as this functionality is currently unsupported
 * - no value for `date` has been provided in the context (as it is needed in order to dispatch copy action to the store)
 */
export const CopyButton: React.FC<SlotButtonProps> = ({ size }) => {
  const dispatch = useDispatch();

  const buttonGroupContext = useContext(ButtonGroupContext);

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotOpeartionButtons` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { date, contextType, slotsToCopy, iconSize } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if trying to render within `contextType = "slot"`
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
    contextType === ButtonContextType.Day ? copySlotsDay : copySlotsWeek;
  const onCopy = () => dispatch(copyActionCreator(date));

  // check if there are slots in clipboard for given `contextType`
  const displayBadge = slotsToCopy && slotsToCopy[contextType!];

  return (
    <>
      <IconButton
        size={size || iconSize}
        onClick={onCopy}
        data-testid={__copyButtonId__}
      >
        <Badge color="secondary" variant="dot" invisible={!displayBadge}>
          <FileCopyIcon />
        </Badge>
      </IconButton>
    </>
  );
};

export default CopyButton;

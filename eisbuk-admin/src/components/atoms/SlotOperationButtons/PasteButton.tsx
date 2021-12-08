import React, { useContext } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import IconButton from "@material-ui/core/IconButton";

import AssignmentIcon from "@material-ui/icons/Assignment";

import { ButtonContextType } from "@/enums/components";
import { AdminAria, DateFormat } from "@/enums/translations";

import { SlotButtonProps } from "@/types/components";

import { ButtonGroupContext } from "./SlotOperationButtons";

import {
  __slotButtonNoContextError,
  __pasteButtonWrongContextError,
  __noDatePaste,
} from "@/lib/errorMessages";

import { pasteSlotsDay, pasteSlotsWeek } from "@/store/actions/copyPaste";

import { __pasteButtonId__ } from "@/__testData__/testIds";

/**
 * Button to handle pasting of slots form clipboard to current `day`/`week`,
 * Uses `contextType` param to determine the right action to dispatch to the store
 * and `date` param (from context) to dispatch action with the right date/start-date.
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - trying to render within `contextType = "slot"` as it makes no sence to paste into the existing slot
 * - no value for `date` has been provided within the context (as it is needed for full functionality)
 */
export const PasteButton: React.FC<SlotButtonProps> = ({ size }) => {
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const buttonGroupContext = useContext(ButtonGroupContext);

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotButtonOperations` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { date, contextType, slotsToCopy, iconSize } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if trying to render within `contextType = "slot"`
  if (contextType === ButtonContextType.Slot) {
    console.error(__pasteButtonWrongContextError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if no param for `date` has been provided within the context
  if (!date) {
    console.error(__noDatePaste);
    return null;
  }

  // pick the right action creator with respect to `contextType`
  const pasteActionCreator =
    contextType === ButtonContextType.Day ? pasteSlotsDay : pasteSlotsWeek;
  const handlePaste = () => dispatch(pasteActionCreator(date));

  // check if there are slots in clipboard for given `contextType`
  const disableButton = !(slotsToCopy && slotsToCopy[contextType!]);

  return (
    <>
      <IconButton
        size={size || iconSize}
        onClick={handlePaste}
        disabled={disableButton}
        data-testid={__pasteButtonId__}
        aria-label={`${t(AdminAria.PasteSlots)} ${t(DateFormat.Full, {
          date,
        })}`}
        // aria-label={`Paste copied slots slots on ${date.toFormat("DDDD")}`}
      >
        <AssignmentIcon />
      </IconButton>
    </>
  );
};

export default PasteButton;

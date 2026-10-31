import React, { useContext } from "react";
import { useDispatch } from "react-redux";

import { ClipboardList } from "@eisbuk/svg";
import { useTranslation, SlotsAria } from "@eisbuk/translations";

import { ButtonContextType } from "@/enums/components";

import { ButtonGroupContext } from "./SlotOperationButtons";
import SlotOperationButton from "./SlotOperationButton";

import {
  __slotButtonNoContextError,
  __pasteButtonWrongContextError,
  __noDatePaste,
} from "@/lib/errorMessages";

import {
  isPasteLocked,
  pasteSlotsDay,
  pasteSlotsWeek,
} from "@/store/actions/copyPaste";

import { testId } from "@eisbuk/testing/testIds";

interface Props {
  /** Called when a paste starts */
  onPaste?: () => void;
  /**
   * Called when a started paste ended without writing any slots (it failed, or the
   * clipboard was empty): no slots will change, so nothing else ends the paste.
   */
  onPasteAborted?: () => void;
}

/**
 * Button to handle pasting of slots form clipboard to current `day`/`week`,
 * Uses `contextType` param to determine the right action to dispatch to the store
 * and `date` param (from context) to dispatch action with the right date/start-date.
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - trying to render within `contextType = "slot"` as it makes no sense to paste into the existing slot
 * - no value for `date` has been provided within the context (as it is needed for full functionality)
 */
export const PasteButton: React.FC<Props> = ({ onPaste, onPasteAborted }) => {
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const buttonGroupContext = useContext(ButtonGroupContext);

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotButtonOperations` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const {
    date,
    contextType,
    slotsToCopy,
    disabled: buttonsDisabled,
  } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if trying to render within `contextType = "slot"`
  if (!contextType || contextType === ButtonContextType.Slot) {
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
  const pasteActionLookup = {
    [ButtonContextType.Day]: pasteSlotsDay,
    [ButtonContextType.Week]: pasteSlotsWeek,
  };
  const handlePaste = async () => {
    // An ignored click must not call `onPaste`: the page disables the buttons until
    // the slots change, and a paste that doesn't happen would never change them.
    if (isPasteLocked(contextType, date)) return;

    const pasted = dispatch(pasteActionLookup[contextType](date) as any);
    // Optionally call 'onPaste' callback (if provided)
    if (onPaste) {
      onPaste();
    }

    if (!(await pasted) && onPasteAborted) {
      onPasteAborted();
    }
  };

  // check if there are slots in clipboard for given `contextType`
  const disableButton =
    !(slotsToCopy && slotsToCopy[contextType]) || buttonsDisabled;

  const ariaLabelLookup = {
    [ButtonContextType.Day]: t(SlotsAria.PasteSlotsDay, {
      date,
    }),
    [ButtonContextType.Week]: t(SlotsAria.PasteSlotsWeek, {
      weekStart: date.startOf("week"),
      weekEnd: date.endOf("week"),
    }),
  };
  const ariaLabel = ariaLabelLookup[contextType];

  return (
    <SlotOperationButton
      onClick={handlePaste}
      disabled={disableButton}
      data-testid={testId("paste-button")}
      aria-label={ariaLabel}
    >
      <ClipboardList />
    </SlotOperationButton>
  );
};

export default PasteButton;

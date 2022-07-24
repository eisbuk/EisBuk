import React, { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DateTime } from "luxon";

import Badge from "@mui/material/Badge";

import { Copy } from "@eisbuk/svg";

import { useTranslation, AdminAria, DateFormat } from "@eisbuk/translations";

import { ButtonContextType } from "@/enums/components";

import { SlotButtonProps } from "@/types/components";

import { ButtonGroupContext } from "./SlotOperationButtons";
import SlotOperationButton from "./SlotOperationButton";

import { copySlotsDay, copySlotsWeek } from "@/store/actions/copyPaste";
import { getDayFromClipboard } from "@/store/selectors/copyPaste";

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
export const CopyButton: React.FC<SlotButtonProps> = () => {
  const dispatch = useDispatch();
  const dayInClipboard = useSelector(getDayFromClipboard) || {};

  const { t } = useTranslation();

  const buttonGroupContext = useContext(ButtonGroupContext);

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotOpeartionButtons` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { date, contextType, slotsToCopy } = buttonGroupContext;

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
  const onCopy = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    dispatch(copyActionCreator(date));
  };

  // get date from a slot in the clipboard and show badge only for that date's copy button
  const dateOfDayInClipboard = Object.values(dayInClipboard).pop()?.date;

  const isCopiedDay = slotsToCopy?.day
    ? DateTime.fromISO(dateOfDayInClipboard || "").equals(date)
    : true;
  // check if there are slots in clipboard for given `contextType`
  const displayBadge = slotsToCopy && slotsToCopy[contextType!] && isCopiedDay;

  return (
    <Badge
      aria-label={`${t(AdminAria.CopiedSlotsBadge)} ${t(DateFormat.Full, {
        date,
      })}`}
      color="secondary"
      variant="dot"
      invisible={!displayBadge}
    >
      <SlotOperationButton
        onClick={onCopy}
        data-testid={__copyButtonId__}
        aria-label={`${t(AdminAria.CopySlots)} ${t(DateFormat.Full, { date })}`}
        // aria-label={`Copy slots from ${date.toFormat("DDDD")}`}
      >
        <Copy />
      </SlotOperationButton>
    </Badge>
  );
};

export default CopyButton;

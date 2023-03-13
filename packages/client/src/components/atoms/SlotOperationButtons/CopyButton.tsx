import React, { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DateTime } from "luxon";

import Badge from "@mui/material/Badge";

import { Copy } from "@eisbuk/svg";

import { useTranslation, SlotsAria } from "@eisbuk/translations";

import { ButtonContextType } from "@/enums/components";

import { ButtonGroupContext } from "./SlotOperationButtons";
import SlotOperationButton from "./SlotOperationButton";

import { copySlotsDay, copySlotsWeek } from "@/store/actions/copyPaste";
import {
  getDayFromClipboard,
  getWeekFromClipboard,
} from "@/store/selectors/copyPaste";

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
export const CopyButton: React.FC = () => {
  const dispatch = useDispatch();
  const dayInClipboard = useSelector(getDayFromClipboard) || {};
  const weekInClipboard = useSelector(getWeekFromClipboard);

  const { t } = useTranslation();

  const buttonGroupContext = useContext(ButtonGroupContext);

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotOpeartionButtons` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { date, contextType } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if trying to render within `contextType = "slot"`
  if (contextType === ButtonContextType.Slot || !contextType) {
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

  // Check if there are slots in clipboard for given `contextType` and give date
  const displayBadgeLookup = {
    [ButtonContextType.Day]:
      Object.values(dayInClipboard)[0]?.date === date.toISODate(),
    [ButtonContextType.Week]:
      weekInClipboard?.weekStart &&
      date.startOf("week").equals(weekInClipboard.weekStart),
  };
  const displayBadge = displayBadgeLookup[contextType];

  // Get the right aria label for the button
  const ariaLabelLookup = {
    [ButtonContextType.Day]: t(SlotsAria.CopySlotsDay, { date }),
    [ButtonContextType.Week]: t(SlotsAria.CopySlotsWeek, {
      weekStart: date.startOf("week"),
      weekEnd: date.endOf("week"),
    }),
  };

  return (
    <CopiedSlotsBadge
      displayBadge={Boolean(displayBadge)}
      contextType={contextType}
      date={date}
    >
      <SlotOperationButton
        onClick={onCopy}
        data-testid={__copyButtonId__}
        aria-label={ariaLabelLookup[contextType]}
      >
        <Copy />
      </SlotOperationButton>
    </CopiedSlotsBadge>
  );
};

const CopiedSlotsBadge: React.FC<{
  displayBadge: boolean;
  contextType: ButtonContextType.Day | ButtonContextType.Week;
  date: DateTime;
}> = ({ displayBadge, children, contextType, date }) => {
  const { t } = useTranslation();

  const ariaLabelLookup = {
    [ButtonContextType.Day]: t(SlotsAria.CopiedSlotsDayBadge, { date }),
    [ButtonContextType.Week]: t(SlotsAria.CopiedSlotsWeekBadge, {
      weekStart: date.startOf("week"),
      weekEnd: date.endOf("week"),
    }),
  };

  return (
    <Badge
      aria-label={ariaLabelLookup[contextType]}
      aria-hidden={!displayBadge}
      color="secondary"
      variant="dot"
      invisible={!displayBadge}
    >
      {children}
    </Badge>
  );
};

export default CopyButton;

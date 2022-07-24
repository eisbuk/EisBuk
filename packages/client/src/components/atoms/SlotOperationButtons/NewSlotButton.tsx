import React, { useContext } from "react";
import { useDispatch } from "react-redux";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import { useTranslation, AdminAria, DateFormat } from "@eisbuk/translations";

import { ButtonContextType } from "@/enums/components";

import { SlotButtonProps } from "@/types/components";

import { ButtonGroupContext } from "./SlotOperationButtons";
import SlotOperationButton from "./SlotOperationButton";

import {
  __slotButtonNoContextError,
  __noDateProvidedError,
  __newSlotButtonWrongContextError,
} from "@/lib/errorMessages";

import { openModal } from "@/features/modal/actions";

import { __newSlotButtonId__ } from "@/__testData__/testIds";

/**
 * Button to create a new slot. Opens up a blank SlotForm 'onClick' to
 * futher submit the creation of the new slot to the db.
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - no value for `date` has been provided in the context (as it is needed for full functionality)
 */
export const NewSlotButton: React.FC<SlotButtonProps> = () => {
  const buttonGroupContext = useContext(ButtonGroupContext);

  const { t } = useTranslation();
  const dispatch = useDispatch();

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotOpeartionButtons` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { contextType, date: luxonDate } = buttonGroupContext;

  // prevent component from rendering and log error to console (but don't throw)
  // if trying to render under any context other than `day`
  // this is because adding a new slot on `SlotCard` doesn't make much sense
  // and calling create slot on `week`'s view would not be precise enough (in terms of date the slot belongs to)
  if (contextType !== ButtonContextType.Day) {
    console.error(__newSlotButtonWrongContextError);
    return null;
  }

  // prevent component from rendering and log error to console (but don't throw)
  // if no `date` param provided within the context
  if (!luxonDate) {
    console.error(__noDateProvidedError);
    return null;
  }

  const openForm = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(
      openModal({
        component: "SlotForm",
        props: { date: luxonDate?.toISODate() },
      })
    );
  };

  return (
    <SlotOperationButton
      onClick={openForm}
      data-testid={__newSlotButtonId__}
      aria-label={`${t(AdminAria.CreateSlots)} ${t(DateFormat.Full, {
        date: luxonDate,
      })}`}
      // aria-label={`Create new slots on ${luxonDate.toFormat("DDDD")}`}
    >
      <AddCircleOutlineIcon />
    </SlotOperationButton>
  );
};

export default NewSlotButton;

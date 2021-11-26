import React, { useState, useContext } from "react";

import IconButton from "@material-ui/core/IconButton";

import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";

import { luxon2ISODate } from "eisbuk-shared";

import { ButtonContextType } from "@/enums/components";

import { SlotButtonProps } from "@/types/components";

import SlotForm from "@/components/atoms/SlotForm";
import { ButtonGroupContext } from "./SlotOperationButtons";

import {
  __slotButtonNoContextError,
  __noDateProvidedError,
  __newSlotButtonWrongContextError,
} from "@/lib/errorMessages";

import { __newSlotButtonId__ } from "@/__testData__/testIds";

/**
 * Button to create a new slot. Opens up a blank SlotForm 'onClick' to
 * futher submit the creation of the new slot to the db.
 *
 * **Important:** Will not render if:
 * - not within `SlotOperationButtons` context
 * - no value for `date` has been provided in the context (as it is needed for full functionality)
 */
export const NewSlotButton: React.FC<SlotButtonProps> = ({ size }) => {
  const buttonGroupContext = useContext(ButtonGroupContext);

  const [openForm, setOpenForm] = useState(false);

  const showForm = () => setOpenForm(true);
  const closeForm = () => setOpenForm(false);

  // prevent component from rendering and log error to console (but don't throw)
  // if not rendered within the `SlotOpeartionButtons` context
  if (!buttonGroupContext) {
    console.error(__slotButtonNoContextError);
    return null;
  }

  const { contextType, date: luxonDate, iconSize } = buttonGroupContext;

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

  // luxon day processed to ISO string (for form's input)
  const date = luxon2ISODate(luxonDate);

  return (
    <>
      <IconButton
        size={size || iconSize}
        onClick={showForm}
        data-testid={__newSlotButtonId__}
        aria-label={`Create new slots on ${luxonDate.toFormat("DDDD")}`}
      >
        <AddCircleOutlineIcon />
      </IconButton>
      <SlotForm open={openForm} onClose={closeForm} date={date} />
    </>
  );
};

export default NewSlotButton;

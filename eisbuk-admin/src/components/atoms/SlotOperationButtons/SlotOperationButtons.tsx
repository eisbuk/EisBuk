import React, { createContext } from "react";
import { DateTime } from "luxon";

import Box from "@material-ui/core/Box";

import { Slot } from "eisbuk-shared";

import { ButtonContextType } from "@/enums/components";

type ContextParams = Partial<{
  /**
   * Context of buttons (place of appearance / functionality): `slot`/`day`/`week`
   */
  contextType: ButtonContextType;
  /**
   * Slot to edit/delete/copy.
   * - should be truthy if the buttons are within `slot` context
   * - `undefined` otherwise
   */
  slot: Slot<"id">;
  /**
   * Date context for button functionalities:
   * - should be the date of the day if in `day` context
   * - should be the date of first day in the timeframe if in `week` context
   * - not needed in `slot` context
   */
  date: DateTime;
}>;

export const ButtonGroupContext = createContext<ContextParams | undefined>(
  undefined
);

interface Props extends ContextParams {
  className?: string;
}

/**
 * Container (and context provider) for slot operation buttons:
 * `NewSlotButton`, `EditSlotButton`, `CopyButton`, `PasteButton`, `DeleteButton`
 *
 * **Important:** None of the buttons above will render to DOM if not within the context of this component.
 */
const SlotOperationButtons: React.FC<Props> = ({
  children,
  contextType = ButtonContextType.Week,
  slot,
  date,
  className,
}) => {
  return (
    <ButtonGroupContext.Provider value={{ contextType, slot, date }}>
      <Box display="flex" className={className}>
        {children}
      </Box>
    </ButtonGroupContext.Provider>
  );
};

export default SlotOperationButtons;

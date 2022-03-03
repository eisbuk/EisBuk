import React, { createContext } from "react";
import { DateTime } from "luxon";

import Box from "@mui/material/Box";

import { SlotInterface } from "eisbuk-shared";

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
  slot: SlotInterface;
  /**
   * Date context for button functionalities:
   * - should be the date of the day if in `day` context
   * - should be the date of first day in the timeframe if in `week` context
   * - not needed in `slot` context
   */
  date: DateTime;
  /**
   * Boolean flags for `day` and `week` context types.
   * Used to pass information as to whether or not there are slots in clipboard for given `contextType`.
   * Controls displaying/disabling certain elements of copy/paste functionality.
   */
  slotsToCopy: Partial<{
    [ButtonContextType.Day]: boolean;
    [ButtonContextType.Week]: boolean;
  }>;
  /**
   * Material-UI `size` property, passed to all icons within context
   */
  iconSize: "small" | "medium";
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
  className,
  contextType = ButtonContextType.Week,
  ...context
}) => {
  return (
    <ButtonGroupContext.Provider value={{ contextType, ...context }}>
      <Box display="flex" className={className}>
        {children}
      </Box>
    </ButtonGroupContext.Provider>
  );
};

export default SlotOperationButtons;

import React from "react";

import { SlotCard, SlotCardProps } from "@eisbuk/ui";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons, {
  EditSlotButton,
  DeleteButton,
} from "@/components/atoms/SlotOperationButtons";

export interface SlotCardControllerProps
  extends Omit<SlotCardProps, "additionalActions"> {
  /**
   * Enable edit/delete of the slot in admin view
   */
  enableEdit?: boolean;
  /**
   * Disable slot deletion (we use this if there are booked intervals on a particular slot)
   */
  disableDelete?: boolean;
}

// #region componentFunction
/**
 * Atomic component used to render slot data to the UI. Displayed content can vary according to `view` prop:
 * - "customer" - shows customer view: durations are clickable and trigger subscription to slot (with appropriate message)
 * - "admin" - shows all of the athlete categories for slot (hidden in "customer" view). Additionally, if `enableEdit` prop is `true`, admin can perform edit operations on the slot (edit, delete)
 */
const SlotCardController: React.FC<SlotCardControllerProps> = ({
  enableEdit,
  disableDelete,
  onClick,
  ...slotData
}) => {
  const additionalActions = enableEdit ? (
    <SlotOperationButtons
      className="ml-auto"
      contextType={ButtonContextType.Slot}
      disableDelete={disableDelete}
      slot={slotData}
    >
      <EditSlotButton />
      <DeleteButton />
    </SlotOperationButtons>
  ) : undefined;

  return (
    <SlotCard
      {...slotData}
      onClick={onClick}
      additionalActions={additionalActions}
    />
  );
};
// #endregion componentFunction

export default SlotCardController;

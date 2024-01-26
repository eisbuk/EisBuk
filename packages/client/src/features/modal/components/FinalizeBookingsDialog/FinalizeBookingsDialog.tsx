import React from "react";
import { DateTime } from "luxon";

import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { ModalProps } from "@/features/modal/types";

import { functions } from "@/setup";

import { finalizeBookings } from "./utils";

type FinalizeBookingProps = ModalProps<{
  customerId: string;
  month: DateTime;
  secretKey: string;
}>;

const FinalizeBookingsDialog: React.FC<FinalizeBookingProps> = ({
  customerId,
  month,
  onClose,
  className,
  secretKey,
}) => {
  const onConfirm = () => {
    finalizeBookings(functions, customerId, secretKey);
    onClose();
  };

  return (
    <ActionDialog
      title={i18n.t(Prompt.FinalizeBookingsTitle)}
      onCancel={onClose}
      {...{ onConfirm, className }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.FinalizeBookings)}
    >
      {i18n.t(Prompt.ConfirmFinalizeBookings, { month })}
    </ActionDialog>
  );
};

export default FinalizeBookingsDialog;

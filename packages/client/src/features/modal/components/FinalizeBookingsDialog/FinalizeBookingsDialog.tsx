import React from "react";
import { DateTime } from "luxon";

import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { getSecretKey } from "@/utils/localStorage";
import { finalizeBookings } from "./utils";

interface FinalizeBookingProps {
  customerId: string;
  month: DateTime;
  onClose: () => void;
  className?: string;
}

const FinalizeBookingsDialog: React.FC<FinalizeBookingProps> = ({
  customerId,
  month,
  onClose,
  className,
}) => {
  const onConfirm = () => {
    const secretKey = getSecretKey();
    finalizeBookings(customerId, secretKey);
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

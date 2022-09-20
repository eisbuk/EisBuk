import React from "react";
import { useDispatch } from "react-redux";

import { SlotInterface, SlotInterval } from "@eisbuk/shared";
import { ActionDialog, IntervalCard, IntervalCardVariant } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { cancelBooking } from "@/store/actions/bookingOperations";

import { getSecretKey } from "@/utils/localStorage";

interface CancelBookingContent extends SlotInterface {
  interval: SlotInterval;
  onClose: () => void;
  className?: string;
}

const CancelBookingDialog: React.FC<CancelBookingContent> = ({
  interval,
  onClose,
  className,
  ...slotProps
}) => {
  const dispatch = useDispatch();

  const onConfirm = () => {
    const secretKey = getSecretKey();
    dispatch(cancelBooking({ secretKey, slotId: slotProps.id }));
    onClose();
  };

  return (
    <ActionDialog
      title={i18n.t(Prompt.CancelBookingTitle)}
      onCancel={onClose}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.Confirm)}
      {...{ onConfirm, className }}
    >
      <IntervalCard
        {...{ ...slotProps, interval }}
        variant={IntervalCardVariant.Simple}
      />
    </ActionDialog>
  );
};

export default CancelBookingDialog;

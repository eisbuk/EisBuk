import React from "react";
import { useDispatch } from "react-redux";

import { SlotInterface, SlotInterval } from "@eisbuk/shared";
import { ActionDialog, IntervalCard, IntervalCardVariant } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { cancelBooking } from "@/store/actions/bookingOperations";

interface CancelBookingContent extends SlotInterface {
  interval: SlotInterval;
  onClose: () => void;
  className?: string;
  secretKey: string;
}

const CancelBookingDialog: React.FC<CancelBookingContent> = ({
  interval,
  onClose,
  className,
  secretKey,
  ...slotProps
}) => {
  const dispatch = useDispatch();

  // Convert interval to string for notification purposes
  const intervalString = `${interval.startTime}-${interval.endTime}`;

  const onConfirm = () => {
    dispatch(
      cancelBooking({
        secretKey,
        slotId: slotProps.id,
        date: slotProps.date,
        interval: intervalString,
      })
    );
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

import React from "react";
import { useDispatch } from "react-redux";

import { SlotInterface } from "@eisbuk/shared";
import { ActionDialog, IntervalCard, IntervalCardVariant } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { ModalProps } from "@/features/modal/types";

import { bookInterval } from "@/store/actions/bookingOperations";

type ReplaceBookingProps = ModalProps<
  SlotInterface & {
    secretKey: string;
    /** Interval booked now (as stored in the booking, e.g. "16:00-17:00") */
    bookedInterval: string;
    /** Interval the athlete clicked, which would replace the booked one */
    newInterval: string;
  }
>;

/**
 * Asks the athlete to confirm replacing the interval booked for a lesson with another interval of the same lesson.
 * Shows both: what is booked now and what it will become. The booking is changed only on confirm.
 */
const ReplaceBookingDialog: React.FC<ReplaceBookingProps> = ({
  bookedInterval,
  newInterval,
  onClose,
  className,
  secretKey,
  ...slotProps
}) => {
  const dispatch = useDispatch();

  const onConfirm = () => {
    dispatch(
      bookInterval({
        secretKey,
        slotId: slotProps.id,
        date: slotProps.date,
        interval: newInterval,
        replacedInterval: bookedInterval,
      }),
    );
    onClose();
  };

  return (
    <ActionDialog
      title={i18n.t(Prompt.ReplaceBookingTitle)}
      onCancel={onClose}
      cancelLabel={i18n.t(ActionButton.KeepBooking)}
      confirmLabel={i18n.t(ActionButton.ReplaceBooking)}
      {...{ onConfirm, className }}
    >
      <div className="flex flex-col gap-y-4">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-500">
            {i18n.t(Prompt.ReplaceBookingCurrent)}
          </p>
          <IntervalCard
            {...{ ...slotProps, interval: toSlotInterval(bookedInterval) }}
            variant={IntervalCardVariant.Simple}
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-500">
            {i18n.t(Prompt.ReplaceBookingNew)}
          </p>
          <IntervalCard
            {...{ ...slotProps, interval: toSlotInterval(newInterval) }}
            variant={IntervalCardVariant.Simple}
          />
        </div>
      </div>
    </ActionDialog>
  );
};

/**
 * Interval key ("16:00-17:00") to `{ startTime, endTime }`.
 * Parsed from the key, as the booked interval might no longer exist in `slot.intervals`.
 */
const toSlotInterval = (interval: string) => {
  const [startTime, endTime] = interval.split("-");
  return { startTime, endTime };
};

export default ReplaceBookingDialog;

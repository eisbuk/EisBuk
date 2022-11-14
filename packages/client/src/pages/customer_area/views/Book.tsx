import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { IntervalCardGroup, SlotsDayContainer } from "@eisbuk/ui";
import { SlotInterface } from "@eisbuk/shared";

import BookingsCountdownContainer from "@/controllers/BookingsCountdown";

import {
  getIsBookingAllowed,
  getSlotsForBooking,
} from "@/store/selectors/bookings";
import { getCalendarDay } from "@/store/selectors/app";

import { bookInterval } from "@/store/actions/bookingOperations";

import { getSecretKey } from "@/utils/localStorage";
import { createModal } from "@/features/modal/useModal";

const BookView: React.FC = () => {
  const daysToRender = useSelector(getSlotsForBooking);
  const date = useSelector(getCalendarDay);

  const disabled = !useSelector(getIsBookingAllowed(date));
  const { handleBooking, handleCancellation } = useBooking();

  return (
    <>
      <BookingsCountdownContainer />
      {daysToRender.map(({ date, slots }) => (
        <SlotsDayContainer key={date} date={date}>
          {slots.map(({ interval, ...slot }) => (
            <IntervalCardGroup
              key={slot.id}
              onBook={handleBooking(slot)}
              onCancel={handleCancellation(slot, interval)}
              bookedInterval={interval}
              disabled={Boolean(disabled)}
              {...slot}
            />
          ))}
        </SlotsDayContainer>
      ))}
    </>
  );
};

/**
 * Slot booking and cancel logic, abstracted away in a hook for readability.
 */
const useBooking = () => {
  const dispatch = useDispatch();

  const { openWithProps: openCancelBookingDialog } = useCancelBookingModal();

  return {
    handleBooking:
      ({ date, id: slotId }: SlotInterface) =>
      (bookedInterval: string) => {
        const secretKey = getSecretKey();
        dispatch(bookInterval({ slotId, bookedInterval, date, secretKey }));
      },

    handleCancellation: (slot: SlotInterface, interval?: string) => () => {
      if (!interval) return;

      const [startTime, endTime] = interval.split("-");

      openCancelBookingDialog({
        ...slot,
        interval: { startTime, endTime },
      });
    },
  };
};

const useCancelBookingModal = createModal("CancelBookingDialog");

export default BookView;

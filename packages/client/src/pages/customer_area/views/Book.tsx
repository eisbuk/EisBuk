import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { IntervalCardGroup, SlotsDayContainer } from "@eisbuk/ui";
import { SlotInterface } from "@eisbuk/shared";

import BookingsCountdownContainer from "@/controllers/BookingsCountdown";
import AddToCalendar from "@/components/atoms/AddToCalendar";

import {
  getBookedSlotsByMonth,
  getIsBookingAllowed,
  getSlotsForBooking,
  getSlotsForCustomer,
} from "@/store/selectors/bookings";
import { getCalendarDay } from "@/store/selectors/app";

import { bookInterval } from "@/store/actions/bookingOperations";

import { openModal } from "@/features/modal/actions";

import { getSecretKey } from "@/utils/localStorage";

const BookView: React.FC = () => {
  const daysToRender = useSelector(getSlotsForBooking);
  const slotsByDay = useSelector(getSlotsForCustomer);
  const date = useSelector(getCalendarDay);

  const disabled = !useSelector(getIsBookingAllowed(date));
  const { handleBooking, handleCancellation } = useBooking();

  const bookedSlotsByMonth = useSelector(getBookedSlotsByMonth(date.month));

  return (
    <>
      <BookingsCountdownContainer />

      {Object.keys(bookedSlotsByMonth).length !== 0 && (
        <AddToCalendar bookedSlots={bookedSlotsByMonth} slots={slotsByDay} />
      )}
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

      dispatch(
        openModal({
          component: "CancelBookingDialog",
          props: { ...slot, interval: { startTime, endTime } },
        })
      );
    },
  };
};

export default BookView;

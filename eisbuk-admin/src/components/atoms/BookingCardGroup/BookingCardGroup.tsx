import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import { SlotInterface } from "eisbuk-shared";

import BookingCard from "../BookingCard";

import { bookInterval, cancelBooking } from "@/store/actions/bookingOperations";
import { useParams } from "react-router-dom";
import { comparePeriods } from "@/utils/helpers";

export interface Props extends SlotInterface {
  /**
   * Booked interval used to update local state
   * and pass down to children for proper rendering/functionality
   */
  bookedInterval?: string;
  /**
   * A flag to disable all intervals
   */
  disableAll?: boolean;
  /**
   * Since we can't return an array of JSX elements (but rather a React.Fragment with elements inside),
   * we're providing this option if we wan't to wrap each element in a wrapper (passed from parent component)
   */
  WrapElement?: React.FC;
}

const BookingCardGroup: React.FC<Props> = ({
  bookedInterval = null,
  intervals,
  disableAll = false,
  WrapElement = ({ children }) => <>{children}</>,
  ...slotData
}) => {
  const dispatch = useDispatch();

  const { secretKey } = useParams<{ secretKey: string }>();

  /**
   * Local state for booked interval we're using for more responsive UI
   */
  const [localSelected, setLocalSelected] = useState<string | null>(
    bookedInterval || null
  );

  /**
   * Update local state on each `bookedInterval` change.
   * This will be updates from firestore, passed from parent component.
   */
  useEffect(() => {
    setLocalSelected(bookedInterval || null);
  }, [bookedInterval]);

  const updateBookingState = (bookedInterval?: string) => {
    if (bookedInterval) {
      dispatch(
        bookInterval({
          bookedInterval,
          slotId: slotData.id,
          secretKey,
          date: slotData.date,
        })
      );
    } else {
      dispatch(cancelBooking({ slotId: slotData.id, secretKey }));
    }
  };

  /**
   * HOF returns handler for interval booking (curried with interval key) to be passed to each `BookingCard`
   * @param interval string key of appropriate interval, i.e. `"09:00-10:00"`
   * @returns onClick handler to be passed as `bookInterval` prop for `BookingCard`
   */
  const handleBookInterval = (interval: string) => () => {
    setLocalSelected(interval);
    updateBookingState(interval);
  };

  /**
   * Handler used to cancel booking for this slot.
   * Passed to each `BookingCard`
   */
  const handleCancelBooking = () => {
    /** Should update local state */
    setLocalSelected(null);
    updateBookingState();
  };

  const intervalKeys = Object.keys(intervals).sort(comparePeriods);

  return (
    <>
      {intervalKeys.map((interval) => (
        <WrapElement key={interval}>
          <BookingCard
            {...slotData}
            key={interval}
            disabled={disableAll || bookedInterval !== localSelected}
            fade={Boolean(localSelected) && interval !== localSelected}
            interval={intervals[interval]}
            booked={localSelected === interval}
            bookInterval={handleBookInterval(interval)}
            cancelBooking={handleCancelBooking}
          />
        </WrapElement>
      ))}
    </>
  );
};

export default BookingCardGroup;

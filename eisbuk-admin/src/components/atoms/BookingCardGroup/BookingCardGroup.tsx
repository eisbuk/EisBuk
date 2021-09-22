import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import { Customer } from "eisbuk-shared";

import { SlotInterface } from "@/types/temp";

import IntervalCard from "../IntervalCard";

import { bookInterval, cancelBooking } from "@/store/actions/bookingOperations";
import { slot } from "./__testData__/dummyData";

export interface Props extends SlotInterface {
  /**
   * Booked interval used to update local state
   * and pass down to children for proper rendering/functionality
   */
  bookedInterval?: string;
  /**
   * Customer id is used for dispatching of the booking operations
   */
  customerId: Customer["id"];
  /**
   * Since we can't return an array of JSX elements (but rather a React.Fragment with elements inside),
   * we're providing this option if we wan't to wrap each element in a wrapper (passed from parent component)
   */
  WrapElement?: React.FC;
}

const BookingCardGroup: React.FC<Props> = ({
  bookedInterval = null,
  intervals,
  customerId,
  WrapElement = ({ children }) => <>{children}</>,
  ...slotData
}) => {
  const dispatch = useDispatch();

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
          slotId: slot.id,
          customerId,
        })
      );
    } else {
      dispatch(cancelBooking({ slotId: slot.id, customerId }));
    }
  };

  /**
   * HOF returns handler for interval booking (curried with interval key) to be passed to each `IntervalCard`
   * @param interval string key of appropriate interval, i.e. `"09:00-10:00"`
   * @returns onClick handler to be passed as `bookInterval` prop for `IntervalCard`
   */
  const handleBookInterval = (interval: string) => () => {
    setLocalSelected(interval);
    updateBookingState(interval);
  };

  /**
   * Handler used to cancel booking for this slot.
   * Passed to each `IntervalCard`
   */
  const handleCancelBooking = () => {
    /** Should update local state */
    setLocalSelected(null);
    updateBookingState();
  };

  const intervalKeys = Object.keys(intervals);

  return (
    <>
      {intervalKeys.map((interval) => (
        <WrapElement>
          <IntervalCard
            {...slotData}
            key={interval}
            disabled={bookedInterval !== localSelected}
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

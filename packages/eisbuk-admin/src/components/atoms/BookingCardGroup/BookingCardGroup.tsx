import React from "react";
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

  const updateBookingState = (bookedInterval: string) => {
    dispatch(
      bookInterval({
        bookedInterval,
        slotId: slotData.id,
        secretKey,
        date: slotData.date,
      })
    );
  };

  const handleCancelBooking = () => {
    dispatch(cancelBooking({ slotId: slotData.id, secretKey }));
  };

  const intervalKeys = Object.keys(intervals).sort(comparePeriods);

  return (
    <>
      {intervalKeys.map((interval) => (
        <WrapElement key={interval}>
          <BookingCard
            {...slotData}
            key={interval}
            disabled={disableAll}
            fade={Boolean(bookedInterval) && interval !== bookedInterval}
            interval={intervals[interval]}
            booked={bookedInterval === interval}
            bookInterval={() => updateBookingState(interval)}
            cancelBooking={handleCancelBooking}
          />
        </WrapElement>
      ))}
    </>
  );
};

export default BookingCardGroup;

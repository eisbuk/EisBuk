import React, { useState, useEffect } from "react";

import { SlotInterface } from "@/types/temp";

import IntervalCard from "../IntervalCard";
import { __bookingCardId__ } from "@/__testData__/testIds";

export interface Props extends SlotInterface {
  /**
   * Booked interval used to update local state
   * and pass down to children for proper rendering/functionality
   */
  bookedInterval?: string;
}

const BookingCardGroup: React.FC<Props> = ({
  bookedInterval,
  intervals,
  ...slotData
}) => {
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

  /**
   * HOF returns handler for interval booking (curried with interval key) to be passed to each `IntervalCard`
   * @param interval string key of appropriate interval, i.e. `"09:00-10:00"`
   * @returns onClick handler to be passed as `bookInterval` prop for `IntervalCard`
   */
  const handleBookInterval = (interval: string) => () => {
    /** Should update local state */
    setLocalSelected(interval);
  };

  /**
   * Handler used to cancel booking for this slot.
   * Passed to each `IntervalCard`
   */
  const handleCancelBooking = () => {
    /** Should update local state */
    setLocalSelected(null);
  };

  const intervalKeys = Object.keys(intervals);

  return (
    <>
      {intervalKeys.map((interval) => (
        <IntervalCard
          {...slotData}
          fade={interval === bookedInterval}
          interval={intervals[interval]}
          bookInterval={handleBookInterval(interval)}
          cancelBooking={handleCancelBooking}
        />
      ))}
    </>
  );
};

export default BookingCardGroup;

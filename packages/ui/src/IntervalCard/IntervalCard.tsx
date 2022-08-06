import React from "react";

import {
  IntervalCardVariant,
  IntervalCardState,
  IntervalCardProps,
} from "./types";

import IntervalCardContainer from "./IntervalCardContainer";
import CardContent from "./CardContent";

import { calculateDuration } from "./utils";
import BookingButton from "./BookingButton";

const IntervalCard: React.FC<IntervalCardProps> = ({
  interval,
  state = IntervalCardState.Default,
  variant = IntervalCardVariant.Booking,
  type,
  date,
  notes,
  onBook = () => {},
  onCancel = () => {},
  ...containerProps
}) => {
  const duration = calculateDuration(interval.startTime, interval.endTime);

  const cardContentProps = {
    interval,
    state,
    variant,
    type,
    date,
    notes,
    onBook,
    onCancel,
  };

  const handleBookingClick = () =>
    variant === IntervalCardVariant.Calendar ||
    state === IntervalCardState.Active
      ? onCancel()
      : onBook();

  return (
    <IntervalCardContainer
      {...{ ...containerProps, state, duration, type, variant }}
    >
      <CardContent {...cardContentProps} />
      {variant !== IntervalCardVariant.Simple && (
        <BookingButton
          className="absolute right-2 bottom-2 min-w-[85px] justify-center"
          {...{ type, variant, state, duration }}
          onClick={handleBookingClick}
        />
      )}
    </IntervalCardContainer>
  );
};

export default IntervalCard;

import React from "react";

import {
  IntervalCardVariant,
  IntervalCardState,
  IntervalCardProps,
} from "./types";

import BookingButton from "./BookingButton";
import BookingCardContainer from "./BookingCardContainer";
import CalendarCardContainer from "./CalendarCardContainer";
import SimpleCardContainer from "./SimpleCardContainer";
import CardContent from "./CardContent";

import { calculateDuration } from "./utils";

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

  switch (variant) {
    case IntervalCardVariant.Booking:
      return (
        <BookingCardContainer
          {...{ ...containerProps, state, duration, type, variant }}
        >
          <CardContent {...cardContentProps} />
          <BookingButton
            className="absolute right-2 bottom-2 min-w-[85px] justify-center"
            {...{ type, variant, state, duration }}
            onClick={handleBookingClick}
          />
        </BookingCardContainer>
      );

    case IntervalCardVariant.Calendar:
      return (
        <CalendarCardContainer
          {...{ ...containerProps, state, duration, type, variant }}
        >
          <CardContent {...cardContentProps} />
          <BookingButton
            className="absolute right-2 bottom-2 min-w-[85px] justify-center"
            {...{ type, variant, state, duration }}
            onClick={handleBookingClick}
          />
        </CalendarCardContainer>
      );

    case IntervalCardVariant.Simple:
      return (
        <SimpleCardContainer
          {...{ ...containerProps, state, duration, type, variant }}
        >
          <CardContent {...cardContentProps} />
        </SimpleCardContainer>
      );

    // Won't happen, but let's keep eslint happy
    default:
      return null;
  }
};

export default IntervalCard;

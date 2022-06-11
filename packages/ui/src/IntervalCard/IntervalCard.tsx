import React from "react";
import { DateTime } from "luxon";

import { useTranslation, DateFormat } from "@eisbuk/translations";

import {
  IntervalDuration,
  IntervalCardVariant,
  IntervalCardState,
  IntervalCardProps,
} from "./types";

import IntervalCardContainer from "./IntervalCardContainer";
import BookingButton from "./BookingButton";

import { calculateDuration } from "./utils";

const IntervalCard: React.FC<IntervalCardProps> = ({
  interval: { startTime, endTime },
  date: dateISO,
  state = IntervalCardState.Default,
  variant = IntervalCardVariant.Booking,
  type,
  ...containerProps
}) => {
  const { t } = useTranslation();
  const date = DateTime.fromISO(dateISO);

  const duration = calculateDuration(startTime, endTime);

  const dateString = (
    <span className={getDatestringClasses(variant)}>
      {t(DateFormat.Full, { date })}
    </span>
  );

  const timestring = (
    <span className={getTimestringClasses(variant, duration)}>
      {[startTime, endTime].join(" - ")}
    </span>
  );

  return (
    <IntervalCardContainer
      {...{ ...containerProps, state, duration, type, variant }}
    >
      {variant !== IntervalCardVariant.Booking && dateString}

      {timestring}

      {variant !== IntervalCardVariant.Simple && (
        <BookingButton
          className="absolute right-2 bottom-2"
          {...{ type, variant, state, duration }}
        />
      )}
    </IntervalCardContainer>
  );
};

// #region datestringClasses
const getDatestringClasses = (variant: IntervalCardVariant) =>
  [
    "block",
    "text-base",
    variant === IntervalCardVariant.Simple ? "font-medium" : "font-semibold",
  ].join(" ");
// #endregion datestringClasses

// #region timestringClasses
const getTimestringClasses = (
  variant: IntervalCardVariant,
  duration: IntervalDuration
) =>
  variant !== IntervalCardVariant.Booking
    ? timestringSizeLookup[variant].join(" ")
    : timestringBookingSizeLookup[duration].join(" ");

const timestringBookingSizeLookup = {
  [IntervalDuration["1h"]]: ["text-lg", "leading-8", "font-semibold"],
  [IntervalDuration["1.5h"]]: ["text-3xl", "leading-8", "font-semibold"],
  [IntervalDuration["2h"]]: ["text-4xl", "leading-10", "font-semibold"],
};

const timestringSizeLookup = {
  [IntervalCardVariant.Calendar]: ["text-3xl", "font-semibold"],
  [IntervalCardVariant.Simple]: ["text-2xl", "font-medium"],
};
// #endregion timestringClasses

export default IntervalCard;

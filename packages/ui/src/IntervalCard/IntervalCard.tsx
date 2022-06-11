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
  notes,
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

  const notesElement = (
    <p className="text-base text-gray-500 font-medium">{notes}</p>
  );

  return (
    <IntervalCardContainer
      {...{ ...containerProps, state, duration, type, variant }}
    >
      {variant !== IntervalCardVariant.Booking && dateString}

      {timestring}

      {variant !== IntervalCardVariant.Simple && notesElement}

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
  [
    "block",
    ...(variant !== IntervalCardVariant.Booking
      ? timestringSizeLookup[variant]
      : timestringBookingSizeLookup[duration]),
  ].join(" ");

const timestringBookingSizeLookup = {
  [IntervalDuration["1h"]]: ["mb-2", "text-lg", "leading-8", "font-semibold"],
  [IntervalDuration["1.5h"]]: [
    "mb-2",
    "text-3xl",
    "leading-8",
    "font-semibold",
  ],
  [IntervalDuration["2h"]]: ["mb-4", "text-4xl", "leading-10", "font-semibold"],
};

const timestringSizeLookup = {
  [IntervalCardVariant.Calendar]: ["mb-4", "text-3xl", "font-semibold"],
  [IntervalCardVariant.Simple]: ["text-2xl", "font-medium"],
};
// #endregion timestringClasses

export default IntervalCard;

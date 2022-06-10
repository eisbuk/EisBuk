import React from "react";
import { DateTime } from "luxon";

import { useTranslation, DateFormat } from "@eisbuk/translations";

import {
  IntervalDuration,
  IntervalCardVariant,
  IntervalCardState,
  IntervalCardProps,
} from "./types";

import { calculateDuration } from "./utils";
import IntervalCardContainer from "./IntervalCardContainer";

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
    <span
      className={[
        "text-base",
        "block",
        variant === IntervalCardVariant.Simple
          ? "font-medium"
          : "font-semibold",
      ].join(" ")}
    >
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
    </IntervalCardContainer>
  );
};

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

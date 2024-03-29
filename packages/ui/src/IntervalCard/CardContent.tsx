import React from "react";
import { DateTime } from "luxon";

import { useTranslation, DateFormat } from "@eisbuk/translations";
import { getIntervalString } from "@eisbuk/shared/ui";

import { IntervalDuration, IntervalCardVariant } from "./types";

import SlotTypeIcon from "../SlotTypeIcon";

import { calculateDuration } from "./utils";

interface Props {
  interval: any;
  date: any;
  variant: any;
  type: any;
  notes?: any;
}

const CardContent: React.FC<Props> = ({
  interval,
  date: dateISO,
  variant = IntervalCardVariant.Booking,
  type,
  notes,
}) => {
  const { t } = useTranslation();
  const date = DateTime.fromISO(dateISO);

  const { startTime, endTime } = interval;
  const duration = calculateDuration(startTime, endTime);

  const dateString = (
    <span className={getDatestringClasses(variant)}>
      {t(DateFormat.Full, { date })}
    </span>
  );
  const timestring = (
    <span className={getTimestringClasses(variant, duration)}>
      {getIntervalString(interval)}
    </span>
  );
  const notesElement = (
    <p className="text-base text-gray-500 font-medium">{notes}</p>
  );

  return (
    <div className="relative h-full w-full cursor-default select-none pb-14">
      {variant !== IntervalCardVariant.Booking && dateString}

      {timestring}

      {variant !== IntervalCardVariant.Simple && notesElement}

      {variant !== IntervalCardVariant.Simple && (
        <SlotTypeIcon type={type} className="absolute left-0 bottom-0" />
      )}
    </div>
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
  [IntervalDuration["0.5h"]]: ["mb-2", "text-md", "leading-8", "font-semibold"],
  [IntervalDuration["1h"]]: ["mb-2", "text-lg", "leading-8", "font-semibold"],
  [IntervalDuration["1.5h"]]: [
    "mb-2",
    "text-3xl",
    "leading-8",
    "font-semibold",
  ],
  [IntervalDuration["2h"]]: ["mb-4", "text-4xl", "leading-10", "font-semibold"],
  [IntervalDuration["2h+"]]: [
    "mb-4",
    "text-4xl",
    "leading-10",
    "font-semibold",
  ],
};

const timestringSizeLookup = {
  [IntervalCardVariant.Calendar]: ["mb-4", "text-3xl", "font-semibold"],
  [IntervalCardVariant.Simple]: ["text-2xl", "font-medium"],
};
// #endregion timestringClasses

export default CardContent;

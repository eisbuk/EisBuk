import React from "react";
import { DateTime } from "luxon";

import { SlotInterface, SlotInterval, SlotType } from "@eisbuk/shared";
import { useTranslation, DateFormat } from "@eisbuk/translations";

import { calculateDuration } from "./utils";

// #region types
export enum IntervalCardState {
  Default = "default",
  Active = "active",
  Faded = "faded",
  Disabled = "disabled",
}

export enum IntervalCardVariant {
  Booking = "booking",
  Calendar = "calendar",
  Simple = "simple",
}

export enum IntervalDuration {
  "1h",
  "1.5h",
  "2h",
}

interface IntervalCardProps
  extends Pick<SlotInterface, "type" | "date" | "notes"> {
  interval: SlotInterval;
  state?: IntervalCardState;
  variant?: IntervalCardVariant;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}
// #endregion types

// #region Component
const IntervalCard: React.FC<IntervalCardProps> = ({
  type,

  as = "div",
  className: classes,
  variant = IntervalCardVariant.Booking,
  state = IntervalCardState.Default,
  interval: { startTime, endTime },
  date: dateISO,
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

  const className = [
    ...getContainerSizeClasses(variant, duration),
    ...getBorderClasses(type, variant, state),
    getBackgroundColor(type, variant, state),
    classes,
  ].join(" ");

  return React.createElement(
    as,
    { className },
    <>
      {variant !== IntervalCardVariant.Booking && dateString}
      {timestring}
    </>
  );
};
// #endregion Component

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

// #region containerSize
const getContainerSizeClasses = (
  variant: IntervalCardVariant,
  duration: IntervalDuration
) =>
  variant !== IntervalCardVariant.Booking
    ? containerSizeClassesLookup[variant]
    : bookingContainerSizeLookup[duration];

const containerSizeClassesLookup = {
  [IntervalCardVariant.Calendar]: [
    "w-[280px]",
    "h-[152px]",
    "rounded-lg",
    "px-4",
    "py-3",
  ],
  [IntervalCardVariant.Simple]: [
    "w-[219px]",
    "h-20",
    "rounded-md",
    "px-4",
    "py-3",
  ],
};

const bookingContainerSizeLookup = {
  [IntervalDuration["1h"]]: [
    "w-[220px]",
    "h-[110px]",
    "rounded-lg",
    "px-4",
    "py-2.5",
  ],
  [IntervalDuration["1.5h"]]: [
    "w-[320px]",
    "h-[128px]",
    "rounded-lg",
    "px-4",
    "py-3",
  ],
  [IntervalDuration["2h"]]: [
    "w-[401px]",
    "h-[146px]",
    "rounded-lg",
    "px-4",
    "py-3",
  ],
};
// #endregion containerSize

// #region backgroundColor
const getBackgroundColor = (
  type: SlotType,
  variant: IntervalCardVariant,
  state: IntervalCardState
) => {
  const isActive =
    variant === IntervalCardVariant.Booking &&
    state === IntervalCardState.Active;
  const isFaded =
    variant === IntervalCardVariant.Booking &&
    state === IntervalCardState.Faded;

  return isActive
    ? backgroundColorLookup[type]
    : isFaded
    ? "bg-gray-100"
    : "bg-white";
};

const backgroundColorLookup = {
  [SlotType.Ice]: "bg-ice-300",
  [SlotType.OffIce]: "bg-off-ice-300",
};
// #region backgroundColor

// #region border
const getBorderClasses = (
  type: SlotType,
  variant: IntervalCardVariant,
  state: IntervalCardState
) => {
  const borderVariant =
    // If variant is not "Booking", the border is same as for "active" state
    variant !== IntervalCardVariant.Booking ? IntervalCardState.Active : state;

  const borderWidth =
    borderWidthLookup[borderVariant] || borderWidthLookup.default;

  const borderColor =
    borderColorLookup[type][borderVariant] || borderColorLookup.default;

  return [borderWidth, borderColor];
};

const borderWidthLookup = {
  [IntervalCardState.Active]: "border-4",
  default: "border",
};

const borderColorLookup = {
  default: "border-gray-200",
  [SlotType.Ice]: {
    [IntervalCardState.Default]: "border-ice-300",
    [IntervalCardState.Active]: "border-cyan-500",
    [IntervalCardState.Faded]: "border-ice-300",
  },
  [SlotType.OffIce]: {
    [IntervalCardState.Active]: "border-yellow-600",
  },
};
// #endregion border

export default IntervalCard;

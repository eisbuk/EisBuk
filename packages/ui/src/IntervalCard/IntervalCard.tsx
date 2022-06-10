import React from "react";

import { SlotInterface, SlotInterval, SlotType } from "@eisbuk/shared";

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

const IntervalCard: React.FC<IntervalCardProps> = ({
  type,

  as = "div",
  className: classes,
  variant = IntervalCardVariant.Booking,
  state = IntervalCardState.Default,
}) => {
  const className = [
    ...containerBaseClasses,
    ...getContainerSizeClasses(variant, IntervalDuration["1h"]),
    ...getContainerColorClasses(variant, type, state),
    classes,
  ].join(" ");

  return React.createElement(as, { className }, []);
};

const containerBaseClasses = ["px-4", "py-3", "border"];

// #region containerSize
const getContainerSizeClasses = (
  variant: IntervalCardVariant,
  duration: IntervalDuration
) =>
  variant !== IntervalCardVariant.Booking
    ? containerSizeClassesLookup[variant]
    : bookingContainerSizeLookup[duration];

const containerSizeClassesLookup = {
  [IntervalCardVariant.Calendar]: ["w-[280px]", "h-[152px]", "rounded-lg"],
  [IntervalCardVariant.Simple]: ["w-[219px]", "h-20", "rounded-md"],
};

const bookingContainerSizeLookup = {
  [IntervalDuration["1h"]]: ["w-[220px]", "h-[110px]", "rounded-lg"],
  [IntervalDuration["1.5h"]]: ["w-[320px]", "h-[128px]", "rounded-lg"],
  [IntervalDuration["2h"]]: ["w-[401px]", "h-[146px]", "rounded-lg"],
};
// #endregion containerSize

// #region containerColor
const getContainerColorClasses = (
  variant: IntervalCardVariant,
  type: SlotType,
  state: IntervalCardState
) => {
  const typeColor = typeColorLookup[type];
  const { border, bg } = typeColor;

  return variant !== IntervalCardVariant.Booking
    ? ["bg-white", border, "border-4"]
    : state === IntervalCardState.Active
    ? [bg, border, "border-4"]
    : state === IntervalCardState.Disabled
    ? ["bg-gray-100", "border-gray-200"]
    : [
        "bg-white",
        type === SlotType.Ice ? "border-ice-300" : "border-gray-200",
      ];
};

const typeColorLookup = {
  [SlotType.Ice]: {
    bg: "bg-ice-300",
    border: "border-cyan-500",
    buttonBg: "",
    durationBadge: "",
  },
  [SlotType.OffIce]: {
    bg: "bg-off-ice-300",
    border: "border-yellow-600",
    buttonBg: "",
    durationBadge: "",
  },
};

// #endregion containerColor

export default IntervalCard;

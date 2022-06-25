import React from "react";

import { SlotType } from "@eisbuk/shared";

import {
  IntervalCardVariant,
  IntervalCardState,
  IntervalDuration,
  IntervalCardContainerProps,
} from "./types";

const IntervalCardContainer: React.FC<IntervalCardContainerProps> = ({
  type,
  state,
  variant,
  duration,
  children,
  className: classes,
  as = "div",
}) => {
  const className = [
    "relative",
    ...getContainerSizeClasses(variant, duration),
    ...getOutlineClasses(type, variant, state),
    getBackgroundColor(type, variant, state),
    classes,
  ].join(" ");

  return React.createElement(as, { className }, children);
};

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
  const isActive = state === IntervalCardState.Active;

  // Disabled cards and all non-booking variants have white background without hover
  const isWhite =
    state === IntervalCardState.Disabled ||
    variant !== IntervalCardVariant.Booking;

  return isWhite
    ? "bg-white"
    : isActive
    ? backgroundColorLookup[type]
    : "bg-white hover:bg-gray-100";
};

const backgroundColorLookup = {
  [SlotType.Ice]: "bg-ice-300",
  [SlotType.OffIce]: "bg-off-ice-300",
};
// #region backgroundColor

// #region outline
const getOutlineClasses = (
  type: SlotType,
  variant: IntervalCardVariant,
  state: IntervalCardState
) => {
  const outlineVariant =
    // If variant is not "Booking", the outline is same as for "active" state
    variant !== IntervalCardVariant.Booking ? IntervalCardState.Active : state;

  const outlineWidth =
    outlineVariant === IntervalCardState.Active ? "outline-4" : "";

  const outlineColor =
    outlineColorLookup[type][outlineVariant] || outlineColorLookup.default;

  return ["outline", outlineWidth, outlineColor];
};

const outlineColorLookup = {
  default: "outline-gray-200",
  [SlotType.Ice]: {
    [IntervalCardState.Default]: "outline-ice-300",
    [IntervalCardState.Active]: "outline-cyan-500",
  },
  [SlotType.OffIce]: {
    [IntervalCardState.Active]: "outline-yellow-600",
  },
};
// #endregion outline

export default IntervalCardContainer;

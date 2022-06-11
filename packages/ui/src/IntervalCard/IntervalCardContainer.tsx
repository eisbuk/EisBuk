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
    ...getBorderClasses(type, variant, state),
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

export default IntervalCardContainer;

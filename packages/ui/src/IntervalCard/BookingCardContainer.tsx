import React from "react";

import { SlotType } from "@eisbuk/shared";
import { testId } from "@eisbuk/testing/testIds";

import {
  BookingContainerProps,
  IntervalCardState,
  IntervalDuration,
} from "./types";

const BookingCardContainer: React.FC<BookingContainerProps> = ({
  type,
  state = IntervalCardState.Default,
  duration,
  children,
  className: classes,
  as = "div",
}) => {
  const className = [
    "relative",
    "rounded-lg",
    ...containerSizeLookup[duration],
    ...getOutlineClasses(type, state),
    getBackgroundColor(type, state),
    classes,
  ].join(" ");

  return React.createElement(
    as,
    { className, "data-testid": testId("booking-interval-card") },
    children
  );
};

const containerSizeLookup = {
  [IntervalDuration["0.5h"]]: [
    "max-w-[200px]",
    "min-h-[110px]",
    "px-4",
    "py-2.5",
    "w-full",
  ],
  [IntervalDuration["1h"]]: [
    "max-w-[220px]",
    "min-h-[110px]",
    "px-4",
    "py-2.5",
    "w-full",
  ],
  [IntervalDuration["1.5h"]]: [
    "max-w-[320px]",
    "h-[128px]",
    "px-4",
    "py-3",
    "w-full",
  ],
  [IntervalDuration["2h"]]: [
    "max-w-[401px]",
    "h-[146px]",
    "px-4",
    "py-3",
    "w-full",
  ],
  [IntervalDuration["2h+"]]: [
    "max-w-[401px]",
    "h-[146px]",
    "px-4",
    "py-3",
    "w-full",
  ],
};

const getOutlineClasses = (type: SlotType, state: IntervalCardState) => {
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

  const outlineWidth = state === IntervalCardState.Active ? "outline-4" : "";

  const outlineColor =
    outlineColorLookup[type][state] || outlineColorLookup.default;

  return ["outline", outlineWidth, outlineColor];
};

const getBackgroundColor = (type: SlotType, state: IntervalCardState) => {
  const backgroundColorLookup = {
    [SlotType.Ice]: "bg-ice-300",
    [SlotType.OffIce]: "bg-off-ice-300",
  };

  switch (state) {
    case IntervalCardState.Active:
      return backgroundColorLookup[type];

    case IntervalCardState.Disabled:
      return "bg-white";

    default:
      return "bg-white hover:bg-gray-100";
  }
};

export default BookingCardContainer;

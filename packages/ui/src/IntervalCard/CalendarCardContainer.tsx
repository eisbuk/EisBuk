import React from "react";

import { SlotType } from "@eisbuk/shared";

import { IntervalCardContainerProps } from "./types";

const CalendarCardContainer: React.FC<IntervalCardContainerProps> = ({
  type,
  children,
  className: classes,
  as = "div",
}) => {
  const outlineColorLookup = {
    [SlotType.Ice]: "outline-cyan-500",
    [SlotType.OffIce]: "outline-yellow-600",
  };

  const className = [
    "relative",
    "w-[280px]",
    "h-[152px]",
    "rounded-lg",
    "px-4",
    "py-3",
    "bg-white",
    "outline",
    "outline-4",
    outlineColorLookup[type],
    classes,
  ].join(" ");

  return React.createElement(as, { className }, children);
};

export default CalendarCardContainer;

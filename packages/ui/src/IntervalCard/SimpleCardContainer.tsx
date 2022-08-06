import React from "react";

import { SlotType } from "@eisbuk/shared";

import { IntervalCardContainerProps } from "./types";

const SimpleCardContainer: React.FC<IntervalCardContainerProps> = ({
  type,
  children,
  className: inputClasses,
  as = "div",
}) => {
  const outlineColorLookup = {
    [SlotType.Ice]: "outline-cyan-500",
    [SlotType.OffIce]: "outline-yellow-600",
  };

  const className = [
    "relative",
    "w-[219px]",
    "h-20",
    "px-4",
    "py-3",
    "rounded-md",
    "bg-white",
    "outline",
    "outline-4",
    outlineColorLookup[type],
    inputClasses,
  ].join(" ");

  return React.createElement(as, { className }, children);
};

export default SimpleCardContainer;

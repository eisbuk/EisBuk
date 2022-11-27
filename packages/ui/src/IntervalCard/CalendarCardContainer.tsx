import React, { useState } from "react";

import { SlotType } from "@eisbuk/shared";

import { CalendarContainerProps, CalendarContainerInnerProps } from "./types";

// #region innerContainer
export const CalendarCardExpandableContainer: React.FC<
  CalendarContainerProps
> = ({ className: inputClasses, type, as = "div", children }) => {
  const [isEditing, setIsEditing] = useState(false);

  const outerContainerClasses = [
    inputClasses,
    ...outerClasses,
    colorClassLookup[type],
    getCardAnimationClasses("outer", isEditing),
  ].join(" ");

  const innerContainerClasses = [
    ...innerClasses,
    getCardAnimationClasses("inner", isEditing),
  ].join(" ");

  return React.createElement(
    as,
    {
      className: outerContainerClasses,
    },
    <div className={innerContainerClasses}>
      {children({ isEditing, setIsEditing })}
    </div>
  );
};

const outerClasses = ["w-[280px]", "h-full", "p-[3px]"];
const innerClasses = ["relative", "w-full", "bg-white"];

const colorClassLookup = {
  [SlotType.Ice]: "bg-cyan-500",
  [SlotType.OffIce]: "bg-yellow-600",
};

/**
 * Get animation classes for inner and outer card container (creating a 2px border effect by overlaying).
 * Animation controls the expansion of the card
 */
const getCardAnimationClasses = (box: "inner" | "outer", isExpanded: boolean) =>
  [
    ...animationConfig,
    // Number(true) evaluates to 1
    animationClassesLookup[box][Number(isExpanded)],
  ].join(" ");

const animationConfig = ["duration-300", "ease-out"];
const animationClassesLookup = {
  outer: [
    // Expanded
    "[clip-path:inset(0_0_28px_round_8px)]",
    // Not expanded
    "[clip-path:inset(0_round_8px)]",
  ],
  inner: [
    // Expanded
    "[clip-path:inset(0_0_28px_round_6px)]",
    // Not expanded
    "[clip-path:inset(0_round_6px)]",
  ],
};
// #region innerContainer

// #region innerContainer
export const CalendarCardContainerInner: React.FC<
  CalendarContainerInnerProps
> = ({ children, className: classes, as = "div" }) => {
  const className = [
    "relative",
    "w-full",
    "h-[152px]",
    "rounded-lg",
    "px-4",
    "py-3",
    "bg-white",
    classes,
  ].join(" ");

  return React.createElement(as, { className }, children);
};
// #endregion innerContainer

import { SlotType } from "@eisbuk/shared";
import React, { useState } from "react";

import { Pencil } from "@eisbuk/svg";

import { IntervalCardWithNotesProps } from "./types";

import IconButton, {
  IconButtonContentSize,
  IconButtonSize,
} from "../IconButton";
import NotesSection from "./NotesSection";

const IntervalCardWithNotes: React.FC<IntervalCardWithNotesProps> = ({
  className: inputClasses,
  type,
  as = "div",
}) => {
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
      <IconButton
        className={[
          "absolute top-[11px] right-[14px] duration-200",
          isEditing ? "text-teal-700" : "text-teal-600 hover:text-teal-700",
        ].join(" ")}
        size={IconButtonSize.XS}
        contentSize={IconButtonContentSize.Tight}
        onClick={() => setIsEditing(!isEditing)}
        disableHover
      >
        <Pencil />
      </IconButton>

      <NotesSection
        isEditing={isEditing}
        className="absolute right-0 bottom-0 left-0"
      />
    </div>
  );
};

const outerClasses = ["w-[280px]", "h-[288px]", "p-[3px]"];
const innerClasses = ["relative", "w-full", "h-full", "bg-white", "p-4"];

const colorClassLookup = {
  [SlotType.Ice]: "bg-cyan-500",
  [SlotType.OffIce]: "bg-yellow-600",
};

// #region cardAnimation
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
// #region cardAnimation

export default IntervalCardWithNotes;

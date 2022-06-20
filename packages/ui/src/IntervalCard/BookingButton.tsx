import React from "react";

import { SlotType } from "@eisbuk/shared";

import {
  BookingButtonProps,
  IntervalCardState,
  IntervalCardVariant,
  IntervalDuration,
} from "./types";

import Button, { ButtonColor } from "../Button";
import { ActionButton, useTranslation } from "@eisbuk/translations";

const BookingButton: React.FC<
  BookingButtonProps & React.HTMLAttributes<HTMLButtonElement>
> = ({ state, variant, type, className, duration, ...props }) => {
  const { t } = useTranslation();

  // For pusposes of BookingButton, if variant is calendar, the state is automatically active
  const isActive =
    variant === IntervalCardVariant.Calendar ||
    state === IntervalCardState.Active;
  const isDisabled = state === IntervalCardState.Disabled;

  const color = isActive ? ButtonColor.Error : buttonColorLookup[type];

  const label = t(isActive ? ActionButton.Cancel : ActionButton.BookInterval);

  const durationBadge = isActive ? null : (
    <span className={getDurationClasses(type, isDisabled)}>
      {IntervalDuration[duration]}
    </span>
  );

  return (
    <Button
      {...props}
      {...{ color, disabled: isDisabled, className }}
      endAdornment={durationBadge}
    >
      {label}
    </Button>
  );
};

const buttonColorLookup = {
  [SlotType.Ice]: ButtonColor.Primary,
  [SlotType.OffIce]: ButtonColor.Secondary,
};

const getDurationClasses = (type: SlotType, isDisabled: boolean) =>
  [
    "px-1",
    "rounded-md",
    isDisabled ? "bg-gray-300" : durationColorLookup[type],
  ].join(" ");

const durationColorLookup = {
  [SlotType.Ice]: "bg-cyan-600",
  [SlotType.OffIce]: "bg-yellow-700",
};

export default BookingButton;

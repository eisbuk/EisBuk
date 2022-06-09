import React from "react";

import { SlotInterface, SlotInterval } from "@eisbuk/shared";

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

interface IntervalCardProps
  extends Pick<SlotInterface, "type" | "date" | "notes"> {
  interval: SlotInterval;
  state?: IntervalCardState;
  variant?: IntervalCardVariant;
  as?: keyof JSX.IntrinsicElements;
}

const IntervalCard: React.FC<IntervalCardProps> = () => {
  return null;
};

export default IntervalCard;

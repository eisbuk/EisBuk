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

export enum IntervalDuration {
  "1h",
  "1.5h",
  "2h",
}

export interface IntervalCardContainerProps
  extends Pick<SlotInterface, "type"> {
  state: IntervalCardState;
  variant: IntervalCardVariant;
  duration: IntervalDuration;
  children: React.ReactNode | React.ReactNode[];
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export type BookingButtonProps = Omit<
  IntervalCardContainerProps,
  "as" | "children"
>;

export type IntervalCardProps = Pick<SlotInterface, "type" | "date" | "notes"> &
  Omit<Partial<IntervalCardContainerProps>, "duration" | "type"> & {
    interval: SlotInterval;
  };

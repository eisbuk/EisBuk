import { SlotInterface, SlotInterval } from "@eisbuk/shared";

export enum IntervalCardState {
  Default = "default",
  Active = "active",
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

export type IntervalCardProps = Pick<
  SlotInterface,
  "type" | "date" | "notes"
> & {
  interval: SlotInterval;
  onBook?: () => void;
  onCancel?: () => void;
  state?: IntervalCardState;
  variant: IntervalCardVariant;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
};

export type BookingButtonProps = Pick<
  IntervalCardProps,
  "state" | "variant" | "type"
> & { duration: IntervalDuration };

// #region containerProps
export interface CalendarContainerRenderFn {
  (props: { isEditing: boolean; setIsEditing: (isEditing: boolean) => void }):
    | React.ReactNode
    | React.ReactNode[];
}

export type CalendarContainerProps = Pick<
  IntervalCardProps,
  "type" | "className" | "as"
> & { children: CalendarContainerRenderFn };

export type CalendarContainerInnerProps = Pick<
  IntervalCardProps,
  "as" | "className"
>;

export type BookingContainerProps = Pick<
  IntervalCardProps,
  "type" | "state" | "as" | "className"
> & { duration: IntervalDuration };

export type SimpleContainerProps = Pick<
  IntervalCardProps,
  "type" | "as" | "className"
>;
// #endregion containerProps

import {
  CustomerBookingEntry,
  SlotInterface,
  SlotInterval,
} from "@eisbuk/shared";

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
  "0.5h",
  "1h",
  "1.5h",
  "2h",
  "2h+",
}

export type IntervalCardProps = Pick<SlotInterface, "type" | "date" | "notes"> &
  // Booking notes are included in the structure even though they're consumed only by 'calendar' variant
  // but are optional anyhow
  Pick<CustomerBookingEntry, "bookingNotes"> & {
    interval: SlotInterval;
    state?: IntervalCardState;
    variant: IntervalCardVariant;
    onBook?: () => void;
    onCancel?: () => void;
    /**
     * Handler fired when user starts to edit the notes for a booking.
     * It can be used to close all other notes open for edit, or such.
     */
    onNotesEditStart?: () => void;
    /**
     * Handler fired when user edits the booking notes.
     * Should be used to store updates to firestore.
     */
    onNotesEditSave?: (bookingNotes: string) => Promise<void>;
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

export type NotesSectionProps = Pick<
  IntervalCardProps,
  "bookingNotes" | "onNotesEditStart" | "onNotesEditSave"
> & {
  className?: string;
  isEditing?: boolean;
  onEditClose?: () => void;
};

import React from "react";

import { Annotation } from "@eisbuk/svg";

import {
  IntervalCardVariant,
  IntervalCardState,
  IntervalCardProps,
} from "./types";

import IconButton, {
  IconButtonContentSize,
  IconButtonSize,
} from "../IconButton";
import BookingButton from "./BookingButton";
import BookingCardContainer from "./BookingCardContainer";
import {
  CalendarCardExpandableContainer,
  CalendarCardContainerInner,
} from "./CalendarCardContainer";
import SimpleCardContainer from "./SimpleCardContainer";
import CardContent from "./CardContent";
import NotesSection from "./NotesSection";

import { calculateDuration } from "./utils";

const IntervalCard: React.FC<IntervalCardProps> = ({
  interval,
  state,
  variant,
  type,
  date,
  notes,
  bookingNotes,
  onBook = () => {},
  onCancel = () => {},
  onNotesEditStart = () => {},
  onNotesEditSave = async () => {},
  as,
  className,
}) => {
  const duration = calculateDuration(interval.startTime, interval.endTime);

  const cardContentProps = {
    date,
    interval,
    type,
    variant,
    notes,
  };

  const handleBookingClick = () =>
    variant === IntervalCardVariant.Calendar ||
    state === IntervalCardState.Active
      ? onCancel()
      : onBook();

  switch (variant) {
    case IntervalCardVariant.Booking:
      return (
        <BookingCardContainer {...{ state, duration, type, as, className }}>
          <CardContent {...cardContentProps} />
          <BookingButton
            className="absolute right-2 bottom-2 min-w-[85px] justify-center"
            {...{ type, variant, state, duration }}
            onClick={handleBookingClick}
          />
        </BookingCardContainer>
      );

    case IntervalCardVariant.Calendar:
      return (
        <CalendarCardExpandableContainer {...{ type, as, className }}>
          {({ isEditing, setIsEditing }) => (
            <>
              <IconButton
                className={[
                  "absolute top-[11px] right-[14px] duration-200 z-30",
                  isEditing
                    ? "text-teal-700"
                    : "text-teal-600 hover:text-teal-700",
                ].join(" ")}
                size={IconButtonSize.XS}
                contentSize={IconButtonContentSize.Tight}
                onClick={() => setIsEditing(!isEditing)}
                disableHover
              >
                <Annotation />
              </IconButton>

              <CalendarCardContainerInner {...{ as }}>
                <CardContent {...cardContentProps} />
                <BookingButton
                  className="absolute right-2 bottom-2 min-w-[85px] justify-center"
                  {...{ type, variant, state, duration }}
                  onClick={handleBookingClick}
                />
              </CalendarCardContainerInner>

              <NotesSection
                bookingNotes={bookingNotes}
                isEditing={isEditing}
                onNotesEditStart={onNotesEditStart}
                onNotesEditSave={onNotesEditSave}
                onEditClose={() => setIsEditing(false)}
              />
            </>
          )}
        </CalendarCardExpandableContainer>
      );

    case IntervalCardVariant.Simple:
      return (
        <SimpleCardContainer {...{ className, as, type }}>
          <CardContent {...cardContentProps} />
        </SimpleCardContainer>
      );

    // Won't happen, but let's keep eslint happy
    default:
      return null;
  }
};

export default IntervalCard;

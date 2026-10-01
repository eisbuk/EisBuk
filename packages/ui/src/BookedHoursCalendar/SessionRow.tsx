import React, { useState } from "react";
import { DateTime } from "luxon";

import { SlotType } from "@eisbuk/shared";
import { getIntervalString } from "@eisbuk/shared/ui";
import { Annotation } from "@eisbuk/svg";
import { useTranslation, BookedHours, DateFormat } from "@eisbuk/translations";
import { testId } from "@eisbuk/testing/testIds";

import { CalendarSession } from "./types";

import IconButton, {
  IconButtonContentSize,
  IconButtonSize,
} from "../IconButton";
import SlotTypeIcon from "../SlotTypeIcon";
import BookingButton from "../IntervalCard/BookingButton";
import NotesSection from "../IntervalCard/NotesSection";
import { IntervalCardState, IntervalCardVariant } from "../IntervalCard/types";
import { calculateDuration } from "../IntervalCard/utils";

import { formatHours } from "./utils";

interface SessionRowProps {
  session: CalendarSession;
  /** Disables cancellation (e.g. when the booking deadline has passed) */
  disabled?: boolean;
  onCancel?: () => void;
  onNotesEditSave?: (bookingNotes: string) => Promise<void>;
}

/**
 * A compact row for a booked (or attended-only) session, with the same
 * cancel and booking notes actions as the calendar variant of `IntervalCard`.
 */
const SessionRow: React.FC<SessionRowProps> = ({
  session,
  disabled = false,
  onCancel = () => {},
  onNotesEditSave = async () => {},
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const { date, interval, type, notes, bookingNotes, booked, hours } = session;

  const timeAndDuration = (
    <p className="text-lg font-semibold text-gray-800">
      {getIntervalString(interval)}
      {booked && (
        <span className="ml-2 text-sm font-normal text-gray-500 whitespace-nowrap">
          {formatHours(hours)}
        </span>
      )}
    </p>
  );

  const typeAndNotes = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
      <SlotTypeIcon type={type} className="!text-sm" />
      {notes && <span className="break-words">{notes}</span>}
    </div>
  );

  if (!booked) {
    return (
      <li
        className={[
          ...rowClasses,
          "border-dashed",
          borderColorLookup[type],
        ].join(" ")}
      >
        {timeAndDuration}
        {typeAndNotes}
        <p className="mt-1 text-sm text-gray-500 italic">
          {t(BookedHours.AttendedOnly)}
        </p>
      </li>
    );
  }

  return (
    <li
      data-testid={testId("booking-calendar-card")}
      className={[...rowClasses, borderColorLookup[type]].join(" ")}
    >
      {/* The day is in the heading above, this is for screen readers and for matching the card's content */}
      <span className="sr-only">
        {t(DateFormat.Full, { date: DateTime.fromISO(date) })}
      </span>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {timeAndDuration}
          {typeAndNotes}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            className={
              isEditing ? "text-teal-700" : "text-teal-600 hover:text-teal-700"
            }
            size={IconButtonSize.XS}
            contentSize={IconButtonContentSize.Tight}
            onClick={() => setIsEditing(!isEditing)}
            aria-label={t(BookedHours.BookingNotes)}
            aria-pressed={isEditing}
            disableHover
          >
            <Annotation />
          </IconButton>
          <BookingButton
            className="min-w-[85px] justify-center"
            type={type}
            variant={IntervalCardVariant.Calendar}
            state={
              disabled ? IntervalCardState.Disabled : IntervalCardState.Default
            }
            duration={calculateDuration(interval.startTime, interval.endTime)}
            onClick={onCancel}
          />
        </div>
      </div>

      {isEditing ? (
        <NotesSection
          className="mt-2 -mx-3 -mb-2 overflow-hidden rounded-b-lg"
          bookingNotes={bookingNotes}
          isEditing
          onNotesEditSave={onNotesEditSave}
          onEditClose={() => setIsEditing(false)}
        />
      ) : (
        bookingNotes && (
          <p className="mt-2 pt-2 border-t border-gray-200 text-sm text-red-700 whitespace-pre-wrap break-words">
            {bookingNotes}
          </p>
        )
      )}
    </li>
  );
};

const rowClasses = [
  "relative",
  "list-none",
  "px-3",
  "py-2",
  "bg-white",
  "rounded-lg",
  "border",
  "border-l-4",
];

const borderColorLookup = {
  [SlotType.Ice]: "border-cyan-500",
  [SlotType.OffIce]: "border-yellow-600",
};

export default SessionRow;

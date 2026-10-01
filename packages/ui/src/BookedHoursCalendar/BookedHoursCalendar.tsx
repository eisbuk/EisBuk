import React from "react";
import { DateTime } from "luxon";

import { ExclamationCircle } from "@eisbuk/svg";
import { useTranslation, BookedHours, DateFormat } from "@eisbuk/translations";
import { testId } from "@eisbuk/testing/testIds";

import { CalendarSession, CalendarWeek, MonthBookingsSummary } from "./types";

import MonthOverview from "./MonthOverview";
import SessionRow from "./SessionRow";

import { formatMinutes } from "./utils";

interface BookedHoursCalendarProps {
  summary: MonthBookingsSummary;
  /** Disables cancellation (e.g. when the booking deadline for the month has passed) */
  disabled?: boolean;
  onCancel?: (session: CalendarSession) => void;
  onNotesEditSave?: (
    session: CalendarSession,
    bookingNotes: string
  ) => Promise<void>;
}

/**
 * Athlete's bookings for a month: the month's booked hours first,
 * then a week by week overview and the booked sessions grouped by week and day.
 */
const BookedHoursCalendar: React.FC<BookedHoursCalendarProps> = ({
  summary,
  disabled = false,
  onCancel = () => {},
  onNotesEditSave = async () => {},
}) => {
  const { t } = useTranslation();

  const month = DateTime.fromISO(`${summary.month}-01`);
  const weeksWithSessions = summary.weeks.filter((week) =>
    week.days.some((day) => day.sessions.length)
  );

  return (
    <div className="pb-12">
      <div className="-mx-4 px-4 py-4 bg-ice-300 md:mx-0 md:px-0 md:bg-white md:flex md:items-start md:gap-6">
        <div className="px-4 py-3 bg-white rounded-lg border-2 border-gray-200 md:w-80 md:shrink-0">
          <h2 className="text-sm font-medium uppercase text-gray-500">
            {t(BookedHours.MonthTotalTitle, { month })}
          </h2>
          <p
            data-testid={testId("month-total")}
            className="text-4xl font-semibold leading-tight text-gray-800"
          >
            {formatMinutes(summary.minutes)}
          </p>
          <p className="text-sm text-gray-500">
            {t(BookedHours.MonthTotalNote, { count: summary.bookingsCount })}
          </p>

          {summary.excluded.length > 0 && (
            <p
              data-testid={testId("excluded-bookings")}
              className="mt-2 flex gap-2 text-sm text-yellow-700"
            >
              <span className="w-5 h-5 shrink-0">
                <ExclamationCircle />
              </span>
              <span>
                {t(BookedHours.ExcludedBookings, {
                  count: summary.excluded.length,
                  dates: summary.excluded
                    .map(({ date }) =>
                      t(DateFormat.DayMonth, { date: DateTime.fromISO(date) })
                    )
                    .join(", "),
                })}
              </span>
            </p>
          )}
        </div>

        <div className="mt-4 px-3 py-2 bg-white rounded-lg border-2 border-gray-200 md:mt-0 md:w-[420px]">
          <MonthOverview weeks={summary.weeks} minutes={summary.minutes} />
        </div>
      </div>

      {weeksWithSessions.map((week) => (
        <WeekSection
          key={week.startDate}
          week={week}
          disabled={disabled}
          onCancel={onCancel}
          onNotesEditSave={onNotesEditSave}
        />
      ))}
    </div>
  );
};

const WeekSection: React.FC<
  Required<Omit<BookedHoursCalendarProps, "summary">> & { week: CalendarWeek }
> = ({ week, disabled, onCancel, onNotesEditSave }) => {
  const { t } = useTranslation();

  const range = t(BookedHours.WeekRange, {
    start: DateTime.fromISO(week.startDate),
    end: DateTime.fromISO(week.endDate),
  });

  return (
    <section
      data-testid={testId("week-section")}
      data-start-date={week.startDate}
      className="mt-6"
    >
      <h2 className="flex items-baseline justify-between gap-4 px-3 py-2 bg-ice-300 rounded-lg text-gray-700">
        <span className="font-medium">
          {week.startDate === week.endDate
            ? t(BookedHours.Week, {
                range: t(DateFormat.DayMonth, {
                  date: DateTime.fromISO(week.startDate),
                }),
              })
            : t(BookedHours.Week, { range })}
        </span>
        <span className="font-semibold whitespace-nowrap">
          {formatMinutes(week.minutes)}
        </span>
      </h2>

      {week.days
        .filter((day) => day.sessions.length)
        .map((day) => (
          <div
            key={day.date}
            data-testid={testId("calendar-day")}
            data-date={day.date}
            className="mt-3 md:flex md:gap-6"
          >
            <h3 className="mb-2 flex items-baseline justify-between gap-2 text-base text-gray-700 md:w-56 md:shrink-0 md:block">
              <span className="inline-block font-medium first-letter:uppercase">
                {t(DateFormat.Full, { date: DateTime.fromISO(day.date) })}
              </span>
              {day.minutes > 0 && (
                <span className="text-sm text-gray-500 whitespace-nowrap md:block">
                  {formatMinutes(day.minutes)}
                </span>
              )}
            </h3>
            <ul className="flex-grow grid gap-2 lg:grid-cols-2">
              {day.sessions.map((session) => (
                <SessionRow
                  key={`${session.id}-${session.booked}`}
                  session={session}
                  disabled={disabled}
                  onCancel={() => onCancel(session)}
                  onNotesEditSave={(notes) => onNotesEditSave(session, notes)}
                />
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
};

export default BookedHoursCalendar;

import React from "react";
import { DateTime } from "luxon";

import { useTranslation, BookedHours, DateFormat } from "@eisbuk/translations";
import { testId } from "@eisbuk/testing/testIds";

import { CalendarDay, CalendarWeek } from "./types";

import { formatHours } from "./utils";

interface MonthOverviewProps {
  weeks: CalendarWeek[];
  /** Month total, shown below the weekly totals (equal to their sum) */
  hours: number;
  className?: string;
}

/**
 * Compact month grid: weeks in rows (Monday first), days in columns, booked hours for each week in the last column.
 * Days with bookings are highlighted, days outside the month are left blank.
 */
const MonthOverview: React.FC<MonthOverviewProps> = ({
  weeks,
  hours,
  className = "",
}) => {
  const { t } = useTranslation();

  // Any Monday will do, we only need the localized names of the week days
  const monday = DateTime.fromISO("2024-01-01");
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    t(DateFormat.Weekday, { date: monday.plus({ days: i }) })
  );

  return (
    <table
      data-testid={testId("month-overview")}
      aria-label={t(BookedHours.MonthOverview)}
      className={["w-full table-fixed text-center", className].join(" ")}
    >
      <thead>
        <tr className="text-xs uppercase text-gray-500">
          {weekdays.map((weekday) => (
            <th key={weekday} scope="col" className="pb-1 font-medium">
              {weekday}
            </th>
          ))}
          <th scope="col" className="w-[76px] pb-1 font-medium text-right">
            {t(BookedHours.TotalColumn)}
          </th>
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week.startDate} className="border-t border-gray-100">
            {padWeek(week.days).map((day, i) => (
              <td key={day?.date || `blank-${i}`} className="py-1">
                {day && <DayCell day={day} />}
              </td>
            ))}
            <td
              data-testid={testId("week-total")}
              className="py-1 text-right text-sm font-semibold text-gray-700 whitespace-nowrap"
            >
              {week.hours ? formatHours(week.hours) : "–"}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-gray-200">
          <td colSpan={7} />
          <td className="pt-1 text-right text-sm font-bold text-gray-800 whitespace-nowrap">
            {formatHours(hours)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
};

const DayCell: React.FC<{ day: CalendarDay }> = ({ day }) => {
  const dayOfMonth = Number(day.date.substring(8, 10));
  const hasBookings = day.hours > 0;
  const hasAttendedOnly = !hasBookings && day.sessions.length > 0;

  const className = [
    "mx-auto w-7 h-7 flex items-center justify-center rounded-full text-sm",
    hasBookings
      ? "bg-cyan-600 text-white font-semibold"
      : hasAttendedOnly
      ? "ring-1 ring-gray-400 text-gray-700"
      : "text-gray-500",
  ].join(" ");

  return (
    <span
      className={className}
      title={hasBookings ? formatHours(day.hours) : undefined}
    >
      {dayOfMonth}
    </span>
  );
};

/**
 * Places the days of the week under their weekday columns (Monday first),
 * leaving blanks for the days outside the month.
 */
const padWeek = (days: CalendarDay[]): (CalendarDay | null)[] => {
  const cells: (CalendarDay | null)[] = Array(7).fill(null);
  days.forEach((day) => {
    cells[DateTime.fromISO(day.date, { zone: "utc" }).weekday - 1] = day;
  });
  return cells;
};

export default MonthOverview;

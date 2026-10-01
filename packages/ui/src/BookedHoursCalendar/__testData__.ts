import { DateTime } from "luxon";

import { SlotType } from "@eisbuk/shared";

import {
  CalendarDay,
  CalendarSession,
  CalendarWeek,
  ExcludedBooking,
  MonthBookingsSummary,
} from "./types";

// All data here is invented

const session = (
  id: string,
  date: string,
  startTime: string,
  endTime: string,
  hours: number,
  rest: Partial<CalendarSession> = {}
): CalendarSession => ({
  id,
  date,
  type: SlotType.Ice,
  notes: "Pista 1",
  interval: { startTime, endTime },
  hours,
  booked: true,
  ...rest,
});

/**
 * Builds a month summary from a list of sessions (for stories and tests only,
 * the app builds it from the store, in the client package).
 */
export const buildSummary = (
  month: string,
  sessions: CalendarSession[],
  excluded: ExcludedBooking[] = []
): MonthBookingsSummary => {
  const first = DateTime.fromISO(`${month}-01`, { zone: "utc" });
  const days: CalendarDay[] = Array.from(
    { length: first.daysInMonth },
    (_, i) => {
      const date = first.plus({ days: i }).toISODate()!;
      const daySessions = sessions.filter((s) => s.date === date);
      return {
        date,
        sessions: daySessions,
        hours: daySessions.reduce((acc, s) => acc + s.hours, 0),
      };
    }
  );

  const weeks = days.reduce((acc, day) => {
    const week = acc[acc.length - 1];
    if (!week || DateTime.fromISO(day.date, { zone: "utc" }).weekday === 1) {
      return [
        ...acc,
        {
          startDate: day.date,
          endDate: day.date,
          hours: day.hours,
          days: [day],
        },
      ];
    }
    week.endDate = day.date;
    week.hours += day.hours;
    week.days.push(day);
    return acc;
  }, [] as CalendarWeek[]);

  return {
    month,
    hours: weeks.reduce((acc, w) => acc + w.hours, 0),
    bookingsCount: sessions.filter((s) => s.booked).length,
    weeks,
    excluded,
  };
};

export const octoberSessions: CalendarSession[] = [
  session("s1", "2026-10-02", "16:00", "17:50", 2),
  session("s2", "2026-10-06", "16:10", "17:00", 1),
  session("s3", "2026-10-06", "17:10", "18:50", 2, {
    type: SlotType.OffIce,
    notes: "Preparazione atletica, palestra",
    bookingNotes: "Arrivo alle 17:15",
  }),
  session("s4", "2026-10-08", "18:00", "18:50", 0, { booked: false }),
  session("s5", "2026-10-14", "21:00", "22:15", 1.5),
  session("s6", "2026-10-25", "17:00", "17:50", 1),
  session("s7", "2026-10-26", "17:00", "17:50", 1),
];

export const octoberSummary = buildSummary("2026-10", octoberSessions);

export const octoberSummaryWithExcluded = buildSummary(
  "2026-10",
  octoberSessions,
  [
    {
      slotId: "s8",
      date: "2026-10-20",
      interval: "17:50-17:00",
      reason: "invalid-interval",
    },
  ]
);

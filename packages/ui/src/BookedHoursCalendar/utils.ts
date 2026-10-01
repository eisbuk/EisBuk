import i18n, { BookedHours } from "@eisbuk/translations";

/**
 * Formats a number of minutes as clock time, e.g. `130 => "2 h 10 min"`, `50 => "50 min"`, `120 => "2 h"`, `0 => "0 h"`.
 * Totals are kept in minutes and formatted only here, for display.
 */
export const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!rest) return i18n.t(BookedHours.Hours, { hours });
  if (!hours) return i18n.t(BookedHours.Minutes, { minutes: rest });
  return i18n.t(BookedHours.HoursAndMinutes, { hours, minutes: rest });
};

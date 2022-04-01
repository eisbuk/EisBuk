import i18n from "i18next";
import { DateTime, DateTimeUnit } from "luxon";

import { DateFormat } from "./translations";

type TranslateFunc = typeof i18n.t;

/**
 * Creates a title from start time and timeframe lenght.
 * @param startDate start date of current timeframe
 * @param timespan timeframe length
 * @param t an optional translate function we're using for dependency injection in tests,
 * falls back to `i18n.t`
 * @returns string to be used as title of the component
 */
export const createDateTitle = (
  startDate: DateTime,
  timespan: DateTimeUnit,
  t: TranslateFunc = i18n.t
): string => {
  switch (timespan) {
    // for monthly view we're using the full month string
    case "month":
      return t(DateFormat.MonthYear, {
        date: startDate,
      });

    // for day view we're using the specialized day string format
    case "day":
      return t(DateFormat.Full, { date: startDate });

    // for week and other views we're using standardized format: showing first and last date within the timeframe
    default:
      const startDateString = t(DateFormat.DayMonth, {
        date: startDate.startOf(timespan),
      });
      const endDateString = t(DateFormat.DayMonth, {
        date: startDate.endOf(timespan).startOf("day"),
      });

      return [startDateString, endDateString].join(" - ");
  }
};

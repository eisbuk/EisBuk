import { DateTime, DateTimeUnit } from "luxon";
import i18n from "i18next";

import { DateFormat } from "@/enums/translations";

/**
 * Creates a title from start time and timeframe lenght.
 * @param startDate start date of current timeframe
 * @param jump timeframe length
 * @returns string to be used as title of the component
 */
export const createDateTitle = (
  startDate: DateTime,
  jump: DateTimeUnit
): string => {
  switch (jump) {
    // for monthly view we're using the full month string
    case "month":
      return i18n.t(DateFormat.MonthYear, {
        date: startDate,
      });

    // for day view we're using the specialized day string format
    case "day":
      return i18n.t(DateFormat.Full, { date: startDate });

    // for week and other views we're using standardized format: showing first and last date within the timeframe
    default:
      const startDateString = i18n.t(DateFormat.DayMonth, {
        date: startDate,
      });
      const endDateString = i18n.t(DateFormat.DayMonth, {
        date: startDate.endOf(jump).startOf("day"),
      });

      return [startDateString, endDateString].join(" - ");
  }
};

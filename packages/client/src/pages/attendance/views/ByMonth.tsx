import React from "react";
import { useSelector } from "react-redux";

import { AttendanceVarianceTable, EmptySpace } from "@eisbuk/ui";
import { useTranslation, Alerts } from "@eisbuk/translations";

import {
  getMonthAttendanceVariance,
  getMonthAttendanceUnresolved,
} from "@/store/selectors/attendance";
import { getCalendarDay } from "@/store/selectors/app";

import { generateDatesInRange } from "@/utils/date";

const AttendanceByDayView: React.FC = () => {
  const { t } = useTranslation();

  const calendarDay = useSelector(getCalendarDay);
  const data = useSelector(getMonthAttendanceVariance);
  const unresolved = useSelector(getMonthAttendanceUnresolved);

  const startDate = calendarDay.startOf("month");
  const endDate = startDate.endOf("month");
  const dates = Array.from(generateDatesInRange(startDate, endDate));

  // Entries we couldn't place in the table (slot or athlete missing from the store)
  // are announced, rather than silently left out of the totals
  const incompleteNotice = unresolved.length ? (
    <p
      role="alert"
      className="mb-4 p-3 rounded-md bg-yellow-100 text-yellow-800 text-sm"
    >
      {t(Alerts.IncompleteAttendance, { count: unresolved.length })}
    </p>
  ) : null;

  return !data.length && !unresolved.length ? (
    <div className="content-container">
      <EmptySpace>
        {t(Alerts.NoAttendance, { currentDate: calendarDay })}
      </EmptySpace>
    </div>
  ) : (
    <>
      {incompleteNotice}
      <AttendanceVarianceTable dates={dates} data={data} />
    </>
  );
};

export default AttendanceByDayView;

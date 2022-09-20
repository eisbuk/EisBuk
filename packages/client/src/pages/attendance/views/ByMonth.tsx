import React from "react";
import { useSelector } from "react-redux";

import { AttendanceVarianceTable, EmptySpace } from "@eisbuk/ui";
import { useTranslation, Alerts } from "@eisbuk/translations";

import { getMonthAttendanceVariance } from "@/store/selectors/attendance";
import { getCalendarDay } from "@/store/selectors/app";

import { generateDatesInRange } from "@/utils/date";

const AttendanceByDayView: React.FC = () => {
  const { t } = useTranslation();

  const calendarDay = useSelector(getCalendarDay);
  const data = useSelector(getMonthAttendanceVariance);

  const startDate = calendarDay.startOf("month");
  const endDate = startDate.endOf("month");
  const dates = Array.from(generateDatesInRange(startDate, endDate));

  return !data.length ? (
    <EmptySpace>
      {t(Alerts.NoAttendance, { currentDate: calendarDay })}
    </EmptySpace>
  ) : (
    <div className="overflow-x-auto">
      <AttendanceVarianceTable dates={dates} data={data} />
    </div>
  );
};

export default AttendanceByDayView;

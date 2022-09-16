import React from "react";
import { useSelector } from "react-redux";

import { AttendanceVarianceTable } from "@eisbuk/ui";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";

const testDates = ["2022-09-01", "2022-09-02", "2022-09-03"];

const testData = [
  {
    athlete: "John Longname Doe",
    hours: {
      "2022-09-01": [1.5, 0],
      "2022-09-02": [1.5, 0.5],
      "2022-09-03": [1.5, 1.5],
    },
  },
  {
    athlete: "Willy Brandt",
    hours: {
      "2022-09-01": [1.5, 1],
      "2022-09-02": [1.5, 1.5],
      "2022-09-03": [0, 0],
    },
  },
  {
    athlete: "Kevin Cosner",
    hours: {
      "2022-09-01": [1, 1],
      "2022-09-02": [1.5, 1.5],
      "2022-09-03": [0, 0],
    },
  },
];

const AttendanceByDayView: React.FC = () => {
  const attendanceCards = useSelector(getSlotsWithAttendance());

  console.log(attendanceCards);

  return <AttendanceVarianceTable dates={testDates} data={testData} />;
};

export default AttendanceByDayView;

import React from "react";
import { ComponentMeta } from "@storybook/react";

import AttendanceReportTable, { DataType } from "./Table";

export default {
  title: "Attendance Report Table",
  component: AttendanceReportTable,
} as ComponentMeta<typeof AttendanceReportTable>;

const testDates = ["2022-09-03", "2022-09-04"];

const testData = [
  {
    athlete: "Chris",
    [DataType.Booked]: {
      "2022-09-03": 1.5,
      "2022-09-04": 2.0,
      total: 3.5,
    },
    [DataType.Delta]: {
      "2022-09-03": +1,
      "2022-09-04": -0.5,
      total: 3.5,
    },
  },
];

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <AttendanceReportTable dates={testDates} data={testData} />
  </>
);

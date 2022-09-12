import React from "react";
import { ComponentMeta } from "@storybook/react";

import AttendanceVarianceTable, { TableData } from "./Table";

export default {
  title: "Attendance Variance Table",
  component: AttendanceVarianceTable,
} as ComponentMeta<typeof AttendanceVarianceTable>;

const testDates = [
  "2022-09-03",
  "2022-09-04",
  "2022-09-05",
  "2022-09-06",
  "2022-09-07",
];

const testData: TableData[] = [
  {
    athlete: "John Doe",
    hours: {
      "2022-09-03": [1.5, 0],
      "2022-09-04": [1.5, 0.5],
      "2022-09-05": [1.5, 1.5],
      "2022-09-06": [0, 0],
      "2022-09-07": [0, 1.5],
    },
  },
  {
    athlete: "Willy Brandt",
    hours: {
      "2022-09-03": [1.5, 1],
      "2022-09-04": [1.5, 1.5],
      "2022-09-05": [0, 0],
      "2022-09-06": [0, 0],
      "2022-09-07": [0, 2],
    },
  },
  {
    athlete: "Kevin Cosner",
    hours: {
      "2022-09-03": [1, 1],
      "2022-09-04": [1.5, 1.5],
      "2022-09-05": [0, 0],
      "2022-09-06": [0, 0],
      "2022-09-07": [2, 2],
    },
  },
];

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <AttendanceVarianceTable dates={testDates} data={testData} />
  </>
);

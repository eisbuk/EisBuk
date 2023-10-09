import React from "react";
import { ComponentMeta } from "@storybook/react";

import AttendanceVarianceTable from "./AttendanceVarianceTable";
import { AthleteAttendanceMonth } from "./types";

export default {
  title: "Attendance Variance Table",
  component: AttendanceVarianceTable,
} as ComponentMeta<typeof AttendanceVarianceTable>;

const testDates = [
  "2022-09-01",
  "2022-09-02",
  "2022-09-03",
  "2022-09-04",
  "2022-09-05",
  "2022-09-06",
  "2022-09-07",
  "2022-09-08",
  "2022-09-09",
  "2022-09-10",
  "2022-09-11",
  "2022-09-12",
  "2022-09-13",
  "2022-09-14",
  "2022-09-15",
  "2022-09-16",
  "2022-09-17",
  "2022-09-18",
  "2022-09-19",
  "2022-09-20",
];

const testData: Iterable<AthleteAttendanceMonth> = [
  [
    "John Longname Doe",
    [
      ["2022-09-01", { booked: 1.5, attended: 0 }],
      ["2022-09-02", { booked: 1.5, attended: 0.5 }],
      ["2022-09-03", { booked: 1.5, attended: 1.5 }],
      ["2022-09-04", { booked: 0, attended: 0 }],
      ["2022-09-05", { booked: 0, attended: 1.5 }],
      ["2022-09-06", { booked: 1, attended: 0 }],
      ["2022-09-07", { booked: 1, attended: 0 }],
      ["2022-09-08", { booked: 0, attended: 1.5 }],
      ["2022-09-09", { booked: 1, attended: 0 }],
      ["2022-09-10", { booked: 0, attended: 1.5 }],
      ["2022-09-11", { booked: 0, attended: 0 }],
      ["2022-09-12", { booked: 1, attended: 0 }],
      ["2022-09-13", { booked: 1.5, attended: 1.5 }],
      ["2022-09-14", { booked: 0, attended: 0 }],
      ["2022-09-15", { booked: 1.5, attended: 1.5 }],
      ["2022-09-16", { booked: 0, attended: 0 }],
      ["2022-09-17", { booked: 1.5, attended: 1 }],
      ["2022-09-18", { booked: 1.5, attended: 1.5 }],
      ["2022-09-19", { booked: 0, attended: 0 }],
      ["2022-09-20", { booked: 0, attended: 1.5 }],
    ],
  ],
  [
    "Willy Brandt",
    [
      ["2022-09-01", { booked: 1.5, attended: 1 }],
      ["2022-09-02", { booked: 1.5, attended: 1.5 }],
      ["2022-09-03", { booked: 0, attended: 0 }],
      ["2022-09-04", { booked: 0, attended: 0 }],
      ["2022-09-05", { booked: 0, attended: 2 }],
      ["2022-09-06", { booked: 1.5, attended: 0 }],
      ["2022-09-07", { booked: 1, attended: 0.5 }],
      ["2022-09-08", { booked: 1.5, attended: 1.5 }],
      ["2022-09-09", { booked: 0, attended: 0 }],
      ["2022-09-10", { booked: 0, attended: 0 }],
      ["2022-09-11", { booked: 0, attended: 0 }],
      ["2022-09-12", { booked: 0, attended: 0.5 }],
      ["2022-09-13", { booked: 1.5, attended: 1.5 }],
      ["2022-09-14", { booked: 0, attended: 0 }],
      ["2022-09-15", { booked: 0, attended: 1.5 }],
      ["2022-09-16", { booked: 1, attended: 1 }],
      ["2022-09-17", { booked: 1, attended: 0.5 }],
      ["2022-09-18", { booked: 0, attended: 0 }],
      ["2022-09-19", { booked: 0, attended: 0 }],
      ["2022-09-20", { booked: 0, attended: 1.5 }],
    ],
  ],
  [
    "Kevin Cosner",
    [
      ["2022-09-01", { booked: 1, attended: 1 }],
      ["2022-09-02", { booked: 1.5, attended: 1.5 }],
      ["2022-09-03", { booked: 0, attended: 0 }],
      ["2022-09-04", { booked: 0, attended: 0 }],
      ["2022-09-05", { booked: 2, attended: 2 }],
      ["2022-09-06", { booked: 1.5, attended: 1.5 }],
      ["2022-09-07", { booked: 1, attended: 1 }],
      ["2022-09-08", { booked: 1.5, attended: 1.5 }],
      ["2022-09-09", { booked: 0, attended: 0 }],
      ["2022-09-10", { booked: 0, attended: 1.5 }],
      ["2022-09-11", { booked: 1.5, attended: 0 }],
      ["2022-09-12", { booked: 1, attended: 0.5 }],
      ["2022-09-13", { booked: 1.5, attended: 1.5 }],
      ["2022-09-14", { booked: 0, attended: 0 }],
      ["2022-09-15", { booked: 1.5, attended: 1.5 }],
      ["2022-09-16", { booked: 0, attended: 0 }],
      ["2022-09-17", { booked: 0, attended: 0 }],
      ["2022-09-18", { booked: 1, attended: 1.5 }],
      ["2022-09-19", { booked: 0, attended: 0 }],
      ["2022-09-20", { booked: 1.5, attended: 1.5 }],
    ],
  ],
];

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <AttendanceVarianceTable dates={testDates} data={testData} />
  </>
);

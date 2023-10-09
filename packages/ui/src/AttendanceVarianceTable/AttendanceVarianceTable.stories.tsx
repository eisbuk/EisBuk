import React from "react";
import { ComponentMeta } from "@storybook/react";

import { AthleteAttendanceMonth } from "./types";

import AttendanceVarianceTable from "./AttendanceVarianceTable";

import { data, dates } from "./test-data.json";

export default {
  title: "Attendance Variance Table",
  component: AttendanceVarianceTable,
} as ComponentMeta<typeof AttendanceVarianceTable>;

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <AttendanceVarianceTable
      dates={dates}
      data={data as AthleteAttendanceMonth[]}
    />
  </>
);

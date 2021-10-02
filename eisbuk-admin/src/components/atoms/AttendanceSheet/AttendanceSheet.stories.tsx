import React from "react";
import AttendanceSheet from "./AttendanceSheet";
import { fb2Luxon } from "@/utils/date";
import {
  baseProps,
  saul,
  walt,
  intervalStrings as intervals,
} from "@/components/atoms/AttendanceCard/__testData__/dummyData";
import AttendanceSheetSlot from "./AttendanceSheetSlot";
export default {
  title: "Attendance Sheet",
  component: AttendanceSheet,
};

const saulBookings = {
  bookedInterval: intervals[0],
  attendedInterval: intervals[1],
};

const waltBookings = {
  bookedInterval: intervals[1],
  attendedInterval: null,
};

const customers = [
  { ...saul, ...saulBookings },
  { ...walt, ...waltBookings },
];

const slots = [
  { ...baseProps, customers },
  { ...baseProps, customers },
];
const date = fb2Luxon(baseProps.date);

export const Default = (): JSX.Element => (
  <AttendanceSheet date={date}>
    {slots.map((slot) => (
      <AttendanceSheetSlot {...slot} />
    ))}
  </AttendanceSheet>
);

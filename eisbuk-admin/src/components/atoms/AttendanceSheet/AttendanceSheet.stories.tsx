import React from "react";
import AttendanceSheetSlot from "./AttendanceSheetSlot";
import {
  baseProps,
  saul,
  walt,
  intervalStrings as intervals,
} from "@/components/atoms/AttendanceCard/__testData__/dummyData";
export default {
  title: "AttendanceSheetSlot",
  component: AttendanceSheetSlot,
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

export const Default = (): JSX.Element => (
  <AttendanceSheetSlot {...{ ...baseProps, customers }} />
);

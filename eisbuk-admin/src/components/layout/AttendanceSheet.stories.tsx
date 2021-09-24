import React from "react";
import AttendanceSheet from "./AttendanceSheet";
import {
  baseProps,
  saul,
  walt,
  intervalStrings as intervals,
} from "@/components/atoms/AttendanceCard/__testData__/dummyData";
export default {
  title: "AttendanceSheet",
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

export const BareAppbar = (): JSX.Element => (
  <AttendanceSheet {...{ ...baseProps, customers }} />
);

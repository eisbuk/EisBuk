import React from "react";

import AttendanceSheet from "./AttendanceSheet";
import AttendanceSheetSlot from "./AttendanceSheetSlot";

import { fromISO } from "@eisbuk/shared";

import {
  baseAttendanceCard,
  intervalStrings as intervals,
} from "@/__testData__/attendance";

import { saul, walt } from "@/__testData__/customers";

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
  { ...baseAttendanceCard, customers, notes: "this slot is in rink 2" },
  { ...baseAttendanceCard, customers },
];
const date = fromISO(baseAttendanceCard.date);

export const Default = (): JSX.Element => (
  <AttendanceSheet date={date}>
    {slots.map((slot) => (
      <AttendanceSheetSlot {...slot} />
    ))}
  </AttendanceSheet>
);

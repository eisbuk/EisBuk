import React from "react";

import { fromISO, SlotType } from "@eisbuk/shared";

import { intervalStrings as intervals } from "@eisbuk/test-data/attendance";
import { saul, walt, gus, jane } from "@eisbuk/test-data/customers";
import { baseSlot } from "@eisbuk/test-data/slots";

import AttendanceSheet from "./AttendanceSheet";

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
  { ...walt, ...waltBookings },
  { ...saul, ...saulBookings },
  { ...gus, ...waltBookings },
];
const customers2 = [
  { ...walt, ...waltBookings },
  { ...jane, ...waltBookings },
  { ...saul, ...saulBookings },

  { ...gus, ...waltBookings },
];

const slots = [
  {
    ...baseSlot,
    type: SlotType.OffIce,
    customers,
    notes:
      "this slot is in rink 2 and extra long note, the quick brown fox jumps over the lazy dog",
  },
  { ...baseSlot, customers: customers2 },
];
const date = fromISO(baseSlot.date);

export const Default = (): JSX.Element => (
  <AttendanceSheet
    organizationName="Organization name"
    date={date}
    data={slots}
  />
);

import React from "react";
import { ComponentMeta } from "@storybook/react";

import List from "@material-ui/core/List";

import AttendanceCard from "./AttendanceCard";

import {
  baseAttendanceCard,
  intervalStrings as intervals,
} from "@/__testData__/attendance";
import { saul, walt, gus } from "@/__testData__/customers";

export default {
  title: "Attendance Card",
  components: AttendanceCard,
  decorators: [
    (Story) => (
      <List style={{ width: 800, margin: "auto" }}>
        <Story />
      </List>
    ),
  ],
} as ComponentMeta<typeof AttendanceCard>;

export const Default = (): JSX.Element => (
  <AttendanceCard {...baseAttendanceCard} />
);

const saulBookings = {
  bookedInterval: intervals[0],
  attendedInterval: intervals[1],
};

const waltBookings = {
  bookedInterval: intervals[1],
  attendedInterval: null,
};

const gusBookings = {
  bookedInterval: null,
  attendedInterval: intervals[1],
};

const customers = [
  { ...saul, ...saulBookings },
  { ...walt, ...waltBookings },
  { ...gus, ...gusBookings },
];

export const MultipleWithCustomers = (): JSX.Element => (
  <>
    <AttendanceCard {...{ ...baseAttendanceCard, customers }} />
    <AttendanceCard {...{ ...baseAttendanceCard, customers: [customers[0]] }} />
  </>
);

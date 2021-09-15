import React from "react";
import { ComponentMeta } from "@storybook/react";

import List from "@material-ui/core/List";

import AttendanceCard from "./AttendanceCard";

import {
  baseProps,
  saul,
  walt,
  intervalStrings as intervals,
} from "./__testData__/dummyData";

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

export const Default = (): JSX.Element => <AttendanceCard {...baseProps} />;

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

export const MultipleWithCustomers = (): JSX.Element => (
  <>
    <AttendanceCard {...{ ...baseProps, customers }} />
    <AttendanceCard {...{ ...baseProps, customers: [customers[0]] }} />
  </>
);

import React from "react";
import { ComponentMeta } from "@storybook/react";

import AttendanceCard from "./AttendanceCard";
import { emptySlot, customersSlot } from "./__testData__/dummyData";

export default {
  title: "Attendance Card",
  components: AttendanceCard,
} as ComponentMeta<typeof AttendanceCard>;

export const Default = (): JSX.Element => <AttendanceCard {...emptySlot} />;
export const WithCustomers = (): JSX.Element => (
  <AttendanceCard {...customersSlot} />
);

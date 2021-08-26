import React from "react";
import { ComponentMeta } from "@storybook/react";

import AttendanceCard from "./AttendanceCard";

export default {
  title: "Attendance Card",
  components: AttendanceCard,
} as ComponentMeta<typeof AttendanceCard>;

export const Default = (): JSX.Element => <AttendanceCard />;

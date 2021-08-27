import React from "react";
import { ComponentMeta } from "@storybook/react";

import AttendanceCard from "./AttendanceCard";
import { Duration, SlotType, Category } from "eisbuk-shared";
import { users } from "./__testData__/dummyData";
import { DateTime } from "luxon";
import { luxonToFB } from "@/utils/date";

export default {
  title: "Attendance Card",
  components: AttendanceCard,
} as ComponentMeta<typeof AttendanceCard>;

const props = {
  date: luxonToFB(DateTime.fromISO("2021-05-25T09:00:00.123")),
  durations: [Duration["1.5h"], Duration["2h"]],
  type: SlotType.Ice,
  userBookings: users,
  categories: [Category.Competitive],
  absentees: ["heisenberg"],
  notes: "",
  id: "123",
};
export const Default = (): JSX.Element => <AttendanceCard {...props} />;

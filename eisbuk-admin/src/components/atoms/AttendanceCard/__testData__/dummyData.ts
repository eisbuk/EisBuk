import { Category, SlotType } from "eisbuk-shared";

import { CustomerWithAttendance } from "@/types/components";

import { Props as AttendanceCardProps } from "../AttendanceCard";

import { testDate } from "@/__testData__/date";
import { gus, walt, saul, jian } from "@/__testData__/customers";

export const allCustomers = [gus, walt, saul, jian];

export const intervals = {
  "13:00-13:30": { startTime: "13:00", endTime: "13:30" },
  "13:00-14:00": { startTime: "13:00", endTime: "14:00" },
  "13:15-14:15": { startTime: "13:15", endTime: "14:15" },
};

export const intervalStrings = Object.keys(intervals);

export const baseProps: AttendanceCardProps = {
  id: "123",
  date: testDate,
  type: SlotType.Ice,
  intervals,
  categories: [Category.Competitive],
  notes: "",
  customers: [] as CustomerWithAttendance[],
  allCustomers,
};

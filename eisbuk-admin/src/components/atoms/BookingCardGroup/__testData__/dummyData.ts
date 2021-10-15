import { Category, SlotType, SlotInterface } from "eisbuk-shared";

import { testDate } from "@/__testData__/date";

export const customerId = "test-customer";

export const intervals = {
  ["09:00-10:00"]: {
    startTime: "09:00",
    endTime: "10:00",
  },
  ["09:00-11:00"]: {
    startTime: "09:00",
    endTime: "11:00",
  },
  ["10:00-11:00"]: {
    startTime: "10:00",
    endTime: "11:00",
  },
};

export const slot: SlotInterface = {
  id: "test-slot",
  date: testDate,
  intervals,
  categories: [Category.Course],
  type: SlotType.Ice,
  notes: "",
};

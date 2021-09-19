import { SlotInterface } from "@/types/temp";
import { DateTime } from "luxon";

import { Category, SlotType } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import { luxonToFB } from "@/utils/date";

export const testDate = DateTime.fromISO(__storybookDate__);

const date = luxonToFB(testDate);

export const intervals = {
  ["09:00-10:00"]: {
    startTime: "09:00",
    endTime: "10:00",
  },
  ["10:00-11:00"]: {
    startTime: "10:00",
    endTime: "11:00",
  },
  ["09:00-11:00"]: {
    startTime: "09:00",
    endTime: "11:00",
  },
};

export const slot: SlotInterface = {
  id: "test-slot",
  date,
  intervals,
  categories: [Category.Course],
  type: SlotType.Ice,
  notes: "",
};

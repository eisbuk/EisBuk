import { SlotType } from "eisbuk-shared";
import { DateTime } from "luxon";

import { __storybookDate__ } from "@/lib/constants";

import { Props } from "../IntervalCard";

import { luxonToFB } from "@/utils/date";

const date = luxonToFB(DateTime.fromISO(__storybookDate__));

export const bookedSlot: Props = {
  date,
  type: SlotType.Ice,
  interval: {
    startTime: "09:00",
    endTime: "10:00",
  },
  notes: "",
  booked: false,
};
export const nonBookedSlot: Props = {
  date,
  type: SlotType.Ice,
  interval: {
    startTime: "10:00",
    endTime: "11:00",
  },
  notes: "",
  booked: true,
};

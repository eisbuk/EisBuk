import { SlotType } from "eisbuk-shared";
import { DateTime } from "luxon";

import { __storybookDate__ } from "@/lib/constants";

import { Props } from "../IntervalCard";

import { luxonToFB } from "@/utils/date";

const date = luxonToFB(DateTime.fromISO(__storybookDate__));

export const baseProps: Props = {
  date,
  type: SlotType.Ice,
  interval: {
    startTime: "09:00",
    endTime: "10:00",
  },
  notes: "",
};

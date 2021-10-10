import { SlotType } from "eisbuk-shared";

import { Props } from "../BookingCard";

import { testDate } from "@/__testData__/date";

export const baseProps: Props = {
  date: testDate,
  type: SlotType.Ice,
  interval: {
    startTime: "09:00",
    endTime: "10:00",
  },
  notes: "",
};

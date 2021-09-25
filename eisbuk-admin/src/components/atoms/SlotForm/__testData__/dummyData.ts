import { Category, SlotType, SlotInterface } from "eisbuk-shared";

import { slotToFormValues } from "../utils";

import { timestampDate } from "@/__testData__/date";

/**
 * A generic, dummy slot we're using for tests as well as stories
 */
export const dummySlot: SlotInterface = {
  id: "some-random-slot",
  date: timestampDate,
  type: SlotType.Ice,
  categories: Object.values(Category),
  intervals: {
    ["10:00-11:30"]: { startTime: "10:00", endTime: "11:30" },
    ["10:00-12:00"]: { startTime: "10:00", endTime: "12:00" },
  },
  notes: "",
};

/**
 * Form values of dummySlot when passed as `slotToEdit` to `SlotForm`
 */
export const { date: dummySlotDate, ...dummySlotFormValues } = slotToFormValues(
  dummySlot
)!;

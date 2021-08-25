import { DateTime } from "luxon";

import { Slot, Duration, SlotType, Category } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import { fb2Luxon, luxonToFB } from "@/utils/date";

// #region slot
export const dummySlot: Slot<"id"> = {
  date: luxonToFB(DateTime.fromISO(__storybookDate__!).plus({ hours: 8 })),
  id: "id",
  durations: [Duration["1h"], Duration["1.5h"], Duration["2h"]],
  type: SlotType.Ice,
  categories: [Category.PreCompetitive],
  notes: "",
};

export const collectionOfSlots = Array(4)
  .fill(null)
  .map((_, i) => {
    const defaultDate = fb2Luxon(dummySlot.date);
    const newDate = defaultDate.plus({ hours: i * 2 });
    const date = luxonToFB(newDate);
    return { ...dummySlot, date };
  });
// #endregion slot

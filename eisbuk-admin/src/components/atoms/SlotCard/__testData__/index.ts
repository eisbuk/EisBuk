import { DateTime } from "luxon";

import { Slot, Duration, SlotType, Category } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import { luxonToFB } from "@/utils/date";

export const dummySlot: Slot<"id"> = {
  date: luxonToFB(DateTime.fromISO(__storybookDate__!).plus({ hours: 8 })),
  id: "id",
  durations: [Duration["1h"], Duration["1.5h"], Duration["2h"]],
  type: SlotType.Ice,
  categories: [Category.PreCompetitive],
  notes: "",
};

export const __slotId__ = "slot-component";

export const __editSlotId__ = "edit-slot-button";
export const __deleteSlotId__ = "delete-slot-button";

export const __slotFormId__ = "slot-form-title";

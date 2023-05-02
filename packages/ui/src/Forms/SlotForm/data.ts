import { SlotInterface, SlotInterval, SlotType } from "@eisbuk/shared";

export type SlotFormValues = Pick<SlotInterface, "type"> &
  Pick<SlotInterface, "categories"> &
  Pick<SlotInterface, "notes"> & { intervals: SlotInterval[] };

export const defaultInterval = {
  startTime: "08:00",
  endTime: "09:00",
};

export const defaultSlotFormValues: SlotFormValues = {
  type: SlotType.Ice,
  categories: [],
  intervals: [defaultInterval],
  notes: "",
};

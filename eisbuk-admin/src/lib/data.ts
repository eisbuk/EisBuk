import { SlotInterface, SlotInterval } from "@/types/temp";

import { SlotType } from "eisbuk-shared";

// #region SlotForm
export const defaultInterval = {
  startTime: "08:00",
  endTime: "09:00",
};

export type SlotFormValues = Pick<SlotInterface, "type"> &
  Pick<SlotInterface, "categories"> &
  Pick<SlotInterface, "notes"> & { intervals: SlotInterval[] };

/**
 * Default slot form values, used as initial values for new slot form.
 */
export const defaultSlotFormValues: SlotFormValues = {
  type: SlotType.Ice,
  categories: [],
  intervals: [defaultInterval],
  notes: "",
};
// #endregion SlotForm

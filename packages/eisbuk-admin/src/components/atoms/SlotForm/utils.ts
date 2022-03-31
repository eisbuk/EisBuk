import { SlotFormValues } from "@/lib/data";

import { SlotInterface } from "eisbuk-shared";

/**
 * Process slot interface into form friendly values
 * @param slot
 * @returns
 */
export const slotToFormValues = (
  slot: SlotInterface | undefined
): (SlotFormValues & { date: string }) | undefined => {
  // fail early if no slot provided
  if (!slot) return undefined;

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    intervals: slotIntervals,
    ...slotValues
  } = slot;

  const intervals = Object.values(slotIntervals);

  return { ...slotValues, intervals };
};

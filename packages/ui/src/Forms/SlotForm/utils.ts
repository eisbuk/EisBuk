import { SlotInterface } from "@eisbuk/shared";

import { type SlotFormValues } from "./data";

/**
 * Process slot interface into form friendly values
 * @param slot
 * @returns
 */
export const slotToFormValues = (
  slot?: Partial<SlotInterface>
): Partial<SlotFormValues> | undefined => {
  // fail early if no slot provided
  if (!slot) return undefined;

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    intervals: slotIntervals,
    ...slotValues
  } = slot;

  return {
    ...slotValues,
    ...(slotIntervals && { intervals: Object.values(slotIntervals) }),
  };
};

import { DateTime } from "luxon";

import { SlotFormValues } from "@/lib/data";

import { SlotInterface } from "eisbuk-shared";

import { fb2Luxon } from "@/utils/date";

/**
 * Process slot interface into form friendly values
 * @param slot
 * @returns
 */
export const slotToFormValues = (
  slot: SlotInterface | undefined
): (SlotFormValues & { date: DateTime }) | undefined => {
  // fail early if no slot provided
  if (!slot) return undefined;

  const {
    date: slotDate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    intervals: slotIntervals,
    ...slotValues
  } = slot;

  const date = fb2Luxon(slotDate);
  const intervals = Object.values(slotIntervals);

  return { ...slotValues, date, intervals };
};

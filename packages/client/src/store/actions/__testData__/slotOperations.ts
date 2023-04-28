import { testDate } from "@/__testData__/date";
import {
  baseSlot as baseSlotWithId,
  createIntervals,
} from "@/__testData__/slots";

export const monthStr = testDate.substr(0, 7);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { id, ...baseSlot } = baseSlotWithId;

export const initialSlotIds = ["dummy-slot-0", "dummy-slot-1"];

/**
 * Initial slots present in the store (for setup)
 */
export const initialSlots = {
  [initialSlotIds[0]]: { ...baseSlot, id: initialSlotIds[0] },
  [initialSlotIds[1]]: {
    ...baseSlot,
    id: initialSlotIds[1],
    intervals: createIntervals(11),
  },
};
/**
 * The slot we're expecting to be created in the store
 */
export const testSlot = {
  ...baseSlot,
  intervals: createIntervals(15),
};

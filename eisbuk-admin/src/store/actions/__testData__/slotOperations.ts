import { testDate, testDateLuxon, timestampDate } from "@/__testData__/date";
import {
  baseSlot as baseSlotWithId,
  createIntervals,
} from "@/__testData__/dummyData";

export const slotId = "slot-0";
export const dateISO = testDate;
export const monthStr = testDate.substr(0, 7);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { id, ...baseSlot } = baseSlotWithId;

/**
 * Initial slots present in the store (for setup)
 */
export const initialSlots = {
  ["dummy-slot-0"]: { ...baseSlot, id: "dummy-slot-0" },
  ["dummy-slot-1"]: {
    ...baseSlot,
    id: "dummy-slot-1",
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
/**
 * The create slot data compliant with form values interface
 * - the date is DateTime instead of Timestamp
 * - the intervals are array rather than record
 */
export const testFromValues = {
  ...baseSlot,
  date: testDateLuxon,
  intervals: Object.values(createIntervals(15)),
};

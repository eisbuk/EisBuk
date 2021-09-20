import { DateTime } from "luxon";

import { SlotType, Category, SlotInterface } from "eisbuk-shared";

import { luxon2ISODate, luxonToFB } from "@/utils/date";

import { testDateLuxon, timestampDate } from "./date";

// #region slot
/**
 * A helper function used to create a slotInterval.
 * Receives startHour (0-24) and duration and creates a record containing
 * one slot interval keyed "<startTime>-<endTime>" and containing start and end time strings
 * @param startHour
 * @param duration
 * @returns
 */
const createIntervalEntry = (startHour: number, duration: number) => {
  const startTimeLuxon = DateTime.fromObject({ hour: startHour });
  const endTimeLuxon = startTimeLuxon.plus({ hours: duration });

  const startTime = startTimeLuxon.toISOTime().substr(0, 5);
  const endTime = endTimeLuxon.toISOTime().substr(0, 5);

  return {
    [`${startTime}-${endTime}`]: {
      startTime,
      endTime,
    },
  };
};

/**
 * A helper function used to create intervals record.
 * Receives start hour (number 0-24) and creates two hour slot with intervals:
 * - `(startHour) - (startHour + 1)`
 * - `(startHour + 1) - (startHour + 2)`
 * - `(startHour) - (startHour + 2)`
 * @param startHour
 * @returns
 */
export const createIntervals = (
  startHour: number
): SlotInterface["intervals"] => ({
  ...createIntervalEntry(startHour, 1),
  ...createIntervalEntry(startHour + 1, 1),
  ...createIntervalEntry(startHour, 2),
});

export const intervals = createIntervals(9);

export const baseSlot: SlotInterface = {
  date: timestampDate,
  id: "id",
  type: SlotType.Ice,
  categories: [Category.Competitive],
  intervals,
  notes: "",
};

export const collectionOfSlots = Array(4)
  .fill(null)
  .map((_, i) => ({
    ...baseSlot,
    id: `slot-${i}`,
    intervals: createIntervals(9 + i * 2),
  }));

/**
 * Dummy month of slots (resembling a structure we should receive from store).
 * Used for `CustomerRoute="book_ice"`
 */
export const slotsMonth = Array(8)
  .fill(testDateLuxon)
  // create dates
  .map((baseDate, i) => {
    // we're putting two slots in each week
    const weekJump = Math.floor(i / 2);
    // one monday and one wednesday
    const dayJump = (i % 2) * 2;

    const resultDate = baseDate.plus({ weeks: weekJump, days: dayJump });
    return luxon2ISODate(resultDate);
  })
  // create a record keyed by iso dates (from last step)
  .reduce((acc, isoDate, i) => {
    // create a simple slot id from current index of the array
    const slotId = `slot-${i}`;

    const date = luxonToFB(DateTime.fromISO(isoDate));
    return {
      ...acc,
      [isoDate]: {
        [slotId]: {
          ...baseSlot,
          id: slotId,
          date,
        },
      },
    };
  }, {} as Record<string, Record<string, SlotInterface>>) as Record<
  string,
  Record<string, SlotInterface>
>;
// #endregion slot

/**
 * Dummy week of slots (resembling a structure we should receive from store).
 * Used for `CustomerRoute="book_off_ice"`
 */
export const slotsWeek = Array(7)
  .fill(testDateLuxon)
  // create dates
  .map((baseDate, i) => baseDate.plus({ days: i }))
  // create a record keyed by iso dates (from last step)
  .reduce((acc, luxonDate, i) => {
    // a fb Timestamp date calculated from key (ISO string)
    const date = luxonToFB(luxonDate);
    // create iso date for keys
    const isoDate = luxon2ISODate(luxonDate);
    // create a simple slot id from current index of the array
    const slotId = `slot-${i}`;
    return {
      ...acc,
      [isoDate]: {
        [slotId]: { ...baseSlot, id: slotId, date },
      },
    };
  }, {} as Record<string, Record<string, SlotInterface>>);
// #endregion slot

// #region customers

// #endregion customers

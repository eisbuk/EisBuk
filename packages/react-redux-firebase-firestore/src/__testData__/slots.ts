import { DateTime } from "luxon";

import { SlotType, Category, SlotInterface } from "@eisbuk/shared";

import { testDate } from "./date";

/**
 * A helper function used to create a slotInterval.
 * Receives startHour (0-24) and duration and creates a record containing
 * one slot interval keyed "<startTime>-<endTime>" and containing start and end time strings
 * @param startHour
 * @param duration
 * @returns
 */
const createIntervalEntry = (startHour: number, duration: number) => {
  const startTimeLuxon = DateTime.fromObject(
    { hour: startHour },
    { zone: "utc" }
  );
  const endTimeLuxon = startTimeLuxon.plus({ hours: duration });

  const startTime = startTimeLuxon.toISOTime().substring(0, 5);
  const endTime = endTimeLuxon.toISOTime().substring(0, 5);

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
  date: testDate,
  id: "base-slot-id",
  type: SlotType.Ice,
  categories: [Category.Competitive, Category.CourseMinors],
  intervals,
  notes: "",
};

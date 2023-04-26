import { SlotInterface, SlotInterval } from "@eisbuk/shared";

/**
 * Calculates the `startTime` of earliset interval and the `endTime` of latest interval,
 * @param intervals a record of all intervals
 * @returns a string representation of slot's timespan: `${startTime} - ${endTime}`
 *
 * @DUPLICATE in @eisbuk/client/src/utils/helpers.ts
 */
export const getSlotTimespan = (
  intervals: SlotInterface["intervals"]
): string => {
  // calculate single { startTime, endTime } object
  const { startTime, endTime } = Object.values(intervals).reduce(
    (acc, interval) => {
      const startTime =
        !acc.startTime || acc.startTime > interval.startTime
          ? interval.startTime
          : acc.startTime;
      const endTime =
        !acc.endTime || acc.endTime < interval.endTime
          ? interval.endTime
          : acc.endTime;

      return { startTime, endTime };
    },
    {} as SlotInterval
  );
  // return time string
  return `${startTime} - ${endTime}`;
};

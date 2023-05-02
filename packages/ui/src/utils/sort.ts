/**
 * `Array.protorype.sort()` callback function:
 *
 * @param {string} first The first time period
 * @param {string} second The second time period
 * @returns number
 * Compares two period strings like "13:30-14:00" and "13:15-14:15"
 * Returns -1 if the first period is earlier than the second; if
 * they're equal it returns -1 if the first period is longer than the second one
 * i.e. if its finishing time is later.
 *
 * @DUPICATE in @eisbuk/client/src/utils/sort.ts
 */
export const comparePeriods = (first: string, second: string): number => {
  const [firstStart, firstEnd] = first.split("-");
  const [secondStart, secondEnd] = second.split("-");

  switch (true) {
    case first === second:
      return 0;

    case firstStart < secondStart:
      return -1;

    case firstStart > secondStart:
      return 1;

    default:
      return firstEnd > secondEnd ? -1 : 1;
  }
};

/**
 * Checks if we've recieved and empty object.
 */
export const isEmpty = (input: unknown): boolean =>
  [undefined, null].includes(input as any)
    ? true
    : input instanceof Object && Object.values(input).length === 0
    ? true
    : false;

/**
 * @param {string} first The first time period
 * @param {string} second The second time period
 * @returns number

 * Compares two period strings like "13:30-14:00" and "13:15-14:15"
 * Returns -1 if the first period is earlier than the second; if
 * they're equal it returns -1 if the first period is longer than the second one
 * i.e. if its finishing time is later.
 */
export const comparePeriods = (first: string, second: string): number => {
  const [firstStart, firstEnd] = first.split("-");
  const [secondStart, secondEnd] = second.split("-");

  if (firstStart < secondStart) {
    return -1;
  } else if (firstStart > secondStart) {
    return 1;
  } else {
    return firstEnd > secondEnd ? -1 : 1;
  }
};

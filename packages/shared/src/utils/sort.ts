import {
  Customer,
  CustomerWithAttendance,
  SlotInterval,
} from "../types/firestore";

import { ID } from "./generators";

/** */
export function composeCompare<T>(
  ...comparators: Array<(a: T, b: T) => number>
) {
  return (a: T, b: T) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}

export function asc<C extends string | number>(): (a: C, b: C) => number;
export function asc<C extends string | number, T>(
  transform: (x: T) => C
): (a: T, b: T) => number;
/** */
export function asc<C extends string | number, T>(transform?: (x: T) => C) {
  return (a: T, b: T) => {
    const _transform = transform || ID<T>;
    const _a = _transform(a);
    const _b = _transform(b);

    return _a < _b ? -1 : _a > _b ? 1 : 0;
  };
}

export function desc<C extends string | number>(): (a: C, b: C) => number;
export function desc<C extends string | number, T>(
  transform: (x: T) => C
): (a: T, b: T) => number;
/** */
export function desc<C extends string | number, T>(transform?: (x: T) => C) {
  return (a: T, b: T) => {
    const _transform = transform || ID<T>;
    const _a = _transform(a);
    const _b = _transform(b);

    return _a > _b ? -1 : _a < _b ? 1 : 0;
  };
}

/** */
function stringToSlotInterval(x: string | SlotInterval): SlotInterval {
  // If x is an interval, return it as is
  if (typeof x !== "string") {
    return x;
  }
  // Split and trim (in an off case where we get a string like "13:30 - 14:00")
  const [startTime = "", endTime = ""] = x.split("-").map((x) => x.trim());
  return { startTime, endTime };
}

/** */
function getStartTime(x: string | SlotInterval) {
  return stringToSlotInterval(x).startTime;
}

/** */
function getIntervalDuration(x: string | SlotInterval) {
  const { startTime, endTime } = stringToSlotInterval(x);
  // If one of the times is missing, return 0 (noop for sorting)
  if (!startTime || !endTime) {
    return 0;
  }
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  return (endHours - startHours) * 60 + (endMinutes - startMinutes);
}

/**
 * To be used as a callback to an `Array.protorype.sort` function.
 *
 * Sorts intervals so that:
 *   - the one that starts earlier comes first
 *   - if start times are equal, the longer interval comes first
 */
export const comparePeriodsEarliestFirst = composeCompare<
  string | SlotInterval
>(
  // Compare (asc) by start time first
  asc(getStartTime),
  // If start times are equal, compare (desc) by end time - longer periods take precedence
  desc(getIntervalDuration)
);

/**
 * To be used as a callback to an `Array.protorype.sort` function.
 *
 * Sorts intervals so that:
 *   - longest intervals come first
 *   - if intervals are of the same length, the one that starts earlier comes first
 */
export const comparePeriodsLongestFirst = composeCompare<string | SlotInterval>(
  // If start times are equal, compare (desc) by end time - longer periods take precedence
  desc(getIntervalDuration),
  // Compare (asc) by start time first
  asc(getStartTime)
);

/**
 * `Array.protorype.sort()` callback function:
 *
 * Compares two `{ name, surname }` entries and returns a sort determinant
 * to sort an array of customers alphabetically, in an accending order,
 * according to surname and then the name (if surname is the same).
 */
export const compareCustomerNames = composeCompare<
  Pick<Customer, "name" | "surname">
>(
  asc((x) => x.surname.toLowerCase()),
  asc((x) => x.name.toLowerCase())
);

/**
 * `Array.protorype.sort()` callback function:
 *
 * Compares two customer with booked interval entries (`{ name, surname, bookedInterval }`)
 * using the `comparePeriods` function first, and if periods are the same, sorts using `compareCustomerNames`.
 * @param customer1
 * @param customer2
 * @returns
 */
export const compareCustomerBookings = composeCompare<
  Pick<CustomerWithAttendance, "name" | "surname" | "bookedInterval">
>(
  (a, b) =>
    comparePeriodsEarliestFirst(a.bookedInterval || "", b.bookedInterval || ""),
  compareCustomerNames
);

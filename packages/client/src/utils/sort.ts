import { CustomerWithAttendance } from "@/types/components";
import { Customer } from "@eisbuk/shared";

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

/**
 * `Array.protorype.sort()` callback function:
 *
 * Compares two `{ name, surname }` entries and returns a sort determinant
 * to sort an array of customers alphabetically, in an accending order,
 * according to surname and then the name (if surname is the same).
 * @param param0
 * @param param1
 * @returns
 */
export const compareCustomerNames = (
  customer1: Pick<Customer, "name" | "surname">,
  customer2: Pick<Customer, "name" | "surname">
) => {
  const nm1 = customer1.name.toLocaleLowerCase();
  const sn1 = customer1.surname.toLocaleLowerCase();

  const nm2 = customer2.name.toLocaleLowerCase();
  const sn2 = customer2.surname.toLocaleLowerCase();

  switch (true) {
    // compare surnames
    case sn1 > sn2:
      return 1;
    case sn1 < sn2:
      return -1;

    // if we made it this far, the surnames are the same
    // compare names
    case nm1 > nm2:
      return 1;
    case nm1 < nm2:
      return -1;

    // this should never happen in a real life scenario
    default:
      return 0;
  }
};

/**
 *
 * `Array.protorype.sort()` callback function:
 *
 * Compares two `{ bookedInterval }` entries using the comparePeriods function,
 * declared above. Used to sort customers in attendance view for some cases.
 * @param param0
 * @param param1
 * @returns
 */
export const compareBookedIntervals = (
  { bookedInterval: bi1 }: Pick<CustomerWithAttendance, "bookedInterval">,
  { bookedInterval: bi2 }: Pick<CustomerWithAttendance, "bookedInterval">
) => comparePeriods(bi1 || "", bi2 || "");

/**
 * `Array.protorype.sort()` callback function:
 *
 * Compares two customer with booked interval entries (`{ name, surname, bookedInterval }`)
 * using the `comparePeriods` function first, and if periods are the same, sorts using `compareCustomerNames`.
 * @param customer1
 * @param customer2
 * @returns
 */
export const compareCustomerBookings = (
  customer1: Pick<
    CustomerWithAttendance,
    "name" | "surname" | "bookedInterval"
  >,
  customer2: Pick<CustomerWithAttendance, "name" | "surname" | "bookedInterval">
): number => {
  const { bookedInterval: bi1 } = customer1;
  const { bookedInterval: bi2 } = customer2;
  const intervalDeterminant = bi1 && bi2 ? comparePeriods(bi1, bi2) : 0;

  if (intervalDeterminant) {
    return intervalDeterminant;
  }

  return compareCustomerNames(customer1, customer2);
};

import { Customer } from "@eisbuk/shared";

/**
 * A comparison function passed as `Array.sort` callback to sort
 * an array of customers alphabetically, in an accending order, according to surname
 * and then the name (if surname is the same)
 */
export const compareCustomers = (
  { name: nm1, surname: sn1 }: Customer,
  { name: nm2, surname: sn2 }: Customer
): number => {
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

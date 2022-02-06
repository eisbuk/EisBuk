import { Customer, CustomerBase } from "../types/firestore";

/**
 * A helper function used to strip excess customer data
 * and create customer base data (used as `bookings` data for customer)
 * @param customer customer entry (without `secretKey` for convenient testing)
 * @returns customer base structure
 */
export const getCustomerBase = ({
  id,
  name,
  surname,
  category,
  extendedDate,
}: Omit<Customer, "secretKey">): CustomerBase => ({
  id,
  name,
  surname,
  category,
  // add extended date only if it exists, rather than saving `extendedDate: undefined`
  ...(extendedDate ? { extendedDate } : {}),
});

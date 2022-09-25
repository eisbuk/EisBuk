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
  categories,
  extendedDate,
  deleted,
}: Omit<Customer, "secretKey">): CustomerBase => ({
  id,
  name,
  surname,
  categories,
  // add extended date only if it exists, rather than saving `extendedDate: undefined`
  ...(extendedDate ? { extendedDate } : {}),
  deleted: Boolean(deleted),
});

/**
 * A helper function used to strip excess customer data
 * and create customer data (used as `bookings` data for customer)
 * @param customer customer entry (without `secretKey` for convenient testing)
 * @returns customer in bookings structure
 */
export const getCustomer = ({
  id,
  name,
  surname,
  categories,
  extendedDate,
  deleted,
  birthday,
  covidCertificateReleaseDate,
  covidCertificateSuspended,
  certificateExpiration,
  email,
  phone,
}: Omit<Customer, "secretKey">): Omit<Customer, "secretKey"> => ({
  id,
  name,
  surname,
  categories,
  // add extended date only if it exists, rather than saving `extendedDate: undefined`
  ...(extendedDate ? { extendedDate } : {}),
  deleted: Boolean(deleted),
  birthday,
  covidCertificateReleaseDate,
  covidCertificateSuspended,
  certificateExpiration,
  email,
  ...(phone ? { phone } : ""),
});

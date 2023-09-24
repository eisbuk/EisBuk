import { Customer } from "../types/firestore";

/**
 * A helper function used to strip admin-only customer data as well as
 * to remove all of the undefined fields (or provide fallback)
 * This is used to create a bookings entry for customer.
 * @param customer
 * @returns
 */
export const sanitizeCustomer = ({
  categories,
  email,
  phone,
  extendedDate,
  birthday,
  photoURL,
  deleted,
  ...restCustomer
}: Omit<Customer, "categories"> &
  Pick<Partial<Customer>, "categories">): Customer => {
  const customer: Customer = { ...restCustomer, categories: [] };

  // Add optional values only if defined
  if (categories) customer.categories = categories;
  if (email) customer.email = email;
  if (phone) customer.phone = phone;
  if (birthday) customer.birthday = birthday;
  if (extendedDate) customer.extendedDate = extendedDate;
  if (photoURL) customer.photoURL = photoURL;
  if (deleted) customer.deleted = deleted;

  return customer;
};

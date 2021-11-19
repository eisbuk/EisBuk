import { Customer, CustomerBase } from "eisbuk-shared";

/**
 * A helper function used to remove `id` and `secretKey`
 * from customer structure for testing purposes
 * @param customer full customer entry
 * @returns customer entry withour `secretKey` and `id`
 */
export const stripIdAndSecretKey = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id: _id,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  secretKey: _secretKey,
  ...customer
}: Customer): Omit<Omit<Customer, "id">, "secretKey"> => customer;
/**
 * A helper function used to strip excess customer data
 * and create customer base data (used to test `booking` entry for customer)
 * @param customer customer entry (without `secretKey` for convenient testing)
 * @returns customer base structure
 */
export const getCustomerBase = ({
  id,
  name,
  surname,
  category,
}: Omit<Customer, "secretKey">): CustomerBase => ({
  id,
  name,
  surname,
  category,
});

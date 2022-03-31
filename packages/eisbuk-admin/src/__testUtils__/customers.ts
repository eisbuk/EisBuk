import { Customer } from "eisbuk-shared";

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

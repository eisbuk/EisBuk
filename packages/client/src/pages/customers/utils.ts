import { Customer } from "@eisbuk/shared";

/**
 * Calculate a default SubscriptionNumber based on existing customers.
 * @param customers Array of the existing customers
 * @returns A strig suitable to be used as a default SubscriptionNumber for new customers
 */
export const getNewSubscriptionNumber = (customers: Customer[]): string => {
  const subscriptionNumbers = customers
    .map((customer) => customer.subscriptionNumber)
    .filter((el) => el && el.match(/^[0-9]*$/))
    .map((num) => Number(num));
  if (subscriptionNumbers.length === 0) return "1";
  return (Math.max(...subscriptionNumbers) + 1).toString();
};

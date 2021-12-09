import { Customer, CustomerBirthday } from "eisbuk-shared";

import { LocalStore } from "@/types/store";
import { DateTime } from "luxon";

/**
 * Get a record of all the customers for current organization from firebase store
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns record of customers
 */
export const getCustomersRecord = (
  state: LocalStore
): Record<string, Customer> => state.firestore.data?.customers || {};

/**
 * Get a list of all the customers for current organization from firebase store
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns list of customers
 */
export const getCustomersList = (state: LocalStore): Customer[] => {
  const customersInStore = getCustomersRecord(state);
  return Object.values(customersInStore);
};

/**
 * Get a list of all the customers whose birthdays are today
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns list of customers grouped by birthday
 */
export const getCustomersWithBirthday = (
  state: LocalStore
): CustomerBirthday => {
  const customersInStore = getCustomersRecord(state);

  // find index of birthday thats >= todays date to slice at that and concat the rest at the end
  const sortedCustomers = Object.values(customersInStore).sort((a, b) =>
    DateTime.fromISO(a.birthday)
      .set({ year: 2000 })
      .toString()
      .localeCompare(
        DateTime.fromISO(b.birthday).set({ year: 2000 }).toString()
      )
  );
  const index = sortedCustomers.findIndex(
    (c) =>
      DateTime.now().startOf("day").set({ year: 2000 }) <=
      DateTime.fromISO(c.birthday).startOf("day").set({ year: 2000 })
  );
  const rearrangedCustomer = sortedCustomers
    .slice(index === -1 ? 0 : index)
    .concat(sortedCustomers.splice(0, index));

  return rearrangedCustomer.reduce(
    (r, v, i, a, k = DateTime.fromISO(v.birthday).toFormat("dd/MM")) => (
      // eslint-disable-next-line
      (r[k] || (r[k] = [])).push(v), r
    ),
    {}
  );
};

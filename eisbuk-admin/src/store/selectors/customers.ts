import { Customer, CustomersByBirthday } from "eisbuk-shared";

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
 * Creates a selector that gets a list of all the customers whose birthdays are today
 * (not an actual firestore query but rather synced local store entry)
 * @param date DateTime to use as "today"
 * @returns selector to get a list of customers grouped by birthday
 */
export const getCustomersWithBirthday =
  (date: string) =>
  (state: LocalStore): CustomersByBirthday[] => {
    const customersInStore = getCustomersRecord(state);

    const customers: CustomersByBirthday[] = [];
    Object.values(customersInStore).forEach((customer) => {
      const index = customers.findIndex(
        (customerBirthday) => customerBirthday.birthday === customer.birthday
      );
      index !== -1
        ? customers[index].customers.push(customer)
        : customers.push({
            birthday: customer.birthday,
            customers: [customer],
          });
    });
    const sortedCustomers = customers.sort((a, b) =>
      DateTime.fromISO(a.birthday)
        .set({ year: 2000 })
        .toString()
        .localeCompare(
          DateTime.fromISO(b.birthday).set({ year: 2000 }).toString()
        )
    );
    const index = sortedCustomers.findIndex(
      (c) => date.substring(5) <= c.birthday.substring(5)
    );
    const rearrangedCustomers = sortedCustomers
      .slice(index === -1 ? 0 : index)
      .concat(index === -1 ? [] : sortedCustomers.slice(0, index));

    return rearrangedCustomers;
  };

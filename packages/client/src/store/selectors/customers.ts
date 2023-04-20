import { DateTime } from "luxon";

import { CustomerFull, CustomersByBirthday } from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { compareCustomerNames } from "@/utils/sort";

/**
 * Get a record of all the customers for current organization from firebase store
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns record of customers
 */
export const getCustomersRecord = (
  state: LocalStore
): Record<string, CustomerFull> => state.firestore.data?.customers || {};

/**
 * Get a list of all the customers for current organization from firebase store
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns list of customers
 */
export const getCustomersList =
  (sort?: boolean) =>
  (state: LocalStore): CustomerFull[] => {
    const customerList = Object.values(getCustomersRecord(state) || {});
    return sort ? customerList.sort(compareCustomerNames) : customerList;
  };

/**
 * Gets a customer from a list of customers by 'secretKey'
 * @param secretKey a customers secret string
 * @returns a customer
 */
export const getCustomerBySecretKey =
  (secretKey: string) => (state: LocalStore) => {
    const customers = getCustomersList()(state);
    const customer = customers.find(
      (customer) => customer.secretKey === secretKey
    );
    return customer || {};
  };

/**
 * Gets a customer from a list of customers by 'secretKey'
 * @param id a customers secret string
 * @returns a customer
 */
export const getCustomerById =
  (id: string) =>
  (state: LocalStore): CustomerFull | undefined => {
    const customers = getCustomersRecord(state);
    return customers[id];
  };

/**
 * Creates a selector that gets a list of all the customers whose birthdays are today
 * (not an actual firestore query but rather synced local store entry)
 * @param date DateTime to use as "today"
 * @returns selector to get a list of customers grouped by birthday
 */
export const getCustomersByBirthday =
  (date: DateTime) =>
  (state: LocalStore): CustomersByBirthday[] => {
    const customersInStore = getCustomersRecord(state);

    const customersByBirthday: CustomersByBirthday[] = [];
    Object.values(customersInStore).forEach((customer) => {
      // omit the customer if the birthday is not provided or customer is deleted
      if (!customer.birthday || customer.deleted) return;
      // we're using just the (mm/dd) date without the year
      const trimmedBirthday = customer.birthday.substring(5);
      const index = customersByBirthday.findIndex(
        (entry) => entry.date === trimmedBirthday
      );
      index !== -1
        ? customersByBirthday[index].customers.push(customer)
        : customersByBirthday.push({
            date: trimmedBirthday,
            customers: [customer],
          });
    });
    const sortedCustomersByBirthday = customersByBirthday.sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const index = sortedCustomersByBirthday.findIndex(
      (entry) => date.toISODate().substring(5) <= entry.date
    );
    const rearrangedCustomers = sortedCustomersByBirthday
      .slice(index === -1 ? 0 : index)
      .concat(index === -1 ? [] : sortedCustomersByBirthday.slice(0, index));

    return rearrangedCustomers;
  };

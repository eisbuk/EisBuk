import { Customer } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

/**
 * Get a list of all the customers for current organization from firebase store
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns list of customers
 */
export const getCustomersList = (state: LocalStore): Customer[] =>
  state.firestore.ordered?.customers || [];

/**
 * Get a record of all the customers for current organization from firebase store
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns list of customers
 */
export const getCustomersRecord = (
  state: LocalStore
): Record<string, Customer> => state.firestore.data?.customers || {};

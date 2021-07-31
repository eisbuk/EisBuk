import { Customer } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

/**
 * Get all customers for current organization from firebase store
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns list of customers
 */
export const getCustomersFromFirebase = (state: LocalStore): Customer[] =>
  state.firestore.ordered.customers;

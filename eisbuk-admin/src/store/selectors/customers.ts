import { Customer } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

export const getOrderedCustomers = (state: LocalStore): Customer[] =>
  state.firestore.ordered.customers || [];

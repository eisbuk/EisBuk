import { LocalStore } from "@/types/store";

import { createTestStore } from "@/__testUtils__/firestore";

import { saul, walt, jian, mike, jane } from "@/__testData__/customers";

/**
 * A customers store input
 */
const customers: LocalStore["firestore"]["data"]["customers"] = {
  [saul.id]: saul,
  [jian.id]: jian,
  [walt.id]: walt,
  [mike.id]: mike,
  [jane.id]: jane,
};

export const expectedCustomersBirthdays = [
  {
    birthday: "12-23",
    customers: [jane],
  },
  {
    birthday: "12-27",
    customers: [mike],
  },
  {
    birthday: "01-01",
    customers: [saul, jian, walt],
  },
];

/**
 * Test store populated with customers we're using to test the selector
 */
export const testStore = createTestStore({
  data: { customers },
});

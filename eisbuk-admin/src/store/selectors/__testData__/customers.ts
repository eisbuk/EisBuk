import { LocalStore } from "@/types/store";

import { saul, walt, jian, mike, jane } from "@/__testData__/customers";

/**
 * A customers store input
 */
export const customers: LocalStore["firestore"]["data"]["customers"] = {
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

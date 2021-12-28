import { LocalStore } from "@/types/store";

import { saul, walt, jian, mike, jane } from "@/__testData__/customers";
import { DateTime } from "luxon";

/**
 * A customers store input
 */
export const customers: LocalStore["firestore"]["data"]["customers"] = {
  [saul.id]: {
    ...saul,
    birthday: DateTime.now().plus({ months: 1 }).toISODate(),
  },
  [jian.id]: {
    ...jian,
    birthday: DateTime.now().plus({ months: 1 }).toISODate(),
  },
  [walt.id]: {
    ...walt,
    birthday: DateTime.now().plus({ months: 1 }).toISODate(),
  },
  [mike.id]: {
    ...mike,
    birthday: DateTime.now().plus({ days: 3 }).toISODate(),
  },
  [jane.id]: { ...jane, birthday: DateTime.now().toISODate() },
};

export const expectedCustomersBirthdays = [
  {
    birthday: DateTime.now().toISODate().substring(5),
    customers: [{ ...jane, birthday: DateTime.now().toISODate() }],
  },
  {
    birthday: DateTime.now().plus({ days: 3 }).toISODate().substring(5),
    customers: [
      { ...mike, birthday: DateTime.now().plus({ days: 3 }).toISODate() },
    ],
  },
  {
    birthday: DateTime.now().plus({ months: 1 }).toISODate().substring(5),
    customers: [
      { ...saul, birthday: DateTime.now().plus({ months: 1 }).toISODate() },
      { ...jian, birthday: DateTime.now().plus({ months: 1 }).toISODate() },
      { ...walt, birthday: DateTime.now().plus({ months: 1 }).toISODate() },
    ],
  },
];

import React from "react";

import { CustomersByBirthday } from "@eisbuk/shared";

import BirthdayMenu from "./BirthdayMenu";

import { saul, walt, gus, jian } from "@/__testData__/customers";
import { DateTime } from "luxon";

export default {
  title: "Birthday Menu",
  component: BirthdayMenu,
};

const birthday = DateTime.now().toISODate().substring(5);

const customers: CustomersByBirthday[] = [
  {
    birthday,
    customers: [
      { ...gus, birthday },
      { ...jian, birthday },
    ],
  },
  {
    birthday: DateTime.now().toISODate().substring(5),
    customers: [saul, walt],
  },
];

export const Default = (): JSX.Element => (
  <div className="bg-gray-500 inline-block">
    <BirthdayMenu customers={customers} />
  </div>
);

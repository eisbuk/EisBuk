import React from "react";
import { DateTime } from "luxon";

import { CustomersByBirthday } from "@eisbuk/shared";

import BirthdayMenu from "./BirthdayMenu";

import { saul, walt, gus, jian } from "@eisbuk/test-data/customers";

export default {
  title: "Birthday Menu",
  component: BirthdayMenu,
};

const today = DateTime.now().toISODate();
const threeDaysFromNow = DateTime.now().plus({ days: 3 }).toISODate();

const birthdays: CustomersByBirthday[] = [
  {
    date: today.substring(5),
    customers: [
      { ...saul, birthday: today },
      { ...walt, birthday: today },
    ],
  },
  {
    date: threeDaysFromNow.substring(5),
    customers: [
      {
        ...gus,
        birthday: threeDaysFromNow,
      },
      {
        ...jian,
        birthday: threeDaysFromNow,
      },
    ],
  },
];

export const AlignRight = (): JSX.Element => (
  <div className="bg-gray-500 inline-block ml-[400px]">
    <BirthdayMenu birthdays={birthdays} />
  </div>
);

export const AlignLeft = (): JSX.Element => (
  <div className="bg-gray-500 inline-block">
    <BirthdayMenu align="left" birthdays={birthdays} />
  </div>
);

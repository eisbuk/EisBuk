import React from "react";

import BirthdayDialog from "./BirthdayDialog";

import * as customersRecord from "../__testData__/customers";

export default {
  title: "Birthday Dialog",
  component: BirthdayDialog,
};

const customers = Object.values(customersRecord);

const firstHalf = customers.slice(0, Math.floor(customers.length / 2));
const secondHalf = customers.slice(Math.floor(customers.length / 2));

const birthdays = [
  {
    date: "12-12",
    customers: firstHalf.map((customer) => ({
      ...customer,
      birthday: "2020-12-12",
    })),
  },
  {
    date: "12-13",
    customers: secondHalf.map((customer) => ({
      ...customer,
      birthday: "2020-12-13",
    })),
  },
];

export const Default = () => <BirthdayDialog {...{ birthdays }} />;

import React from "react";

import { CustomersByBirthday } from "@eisbuk/shared";

import BirthdayMenu from "./BirthdayMenu";

import { saul, walt } from "@/__testData__/customers";

export default {
  title: "Birthday Menu",
  component: BirthdayMenu,
};
const customers: CustomersByBirthday[] = [
  { birthday: "2020-12-12", customers: [saul, walt] },
];
export const Default = (): JSX.Element => (
  <BirthdayMenu customers={customers} />
);

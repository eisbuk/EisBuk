import React from "react";

import { CustomersByBirthday } from "@eisbuk/shared";

import BirthdayMenu from "./BirthdayMenu";

import { saul, walt } from "@/__testData__/customers";
import { DateTime } from "luxon";

export default {
  title: "Birthday Menu",
  component: BirthdayMenu,
};

const customers: CustomersByBirthday[] = [
  { birthday: DateTime.now().toISODate(), customers: [saul, walt] },
];

export const Default = (): JSX.Element => (
  <div className="bg-gray-500 inline-block">
    <BirthdayMenu customers={customers} />
  </div>
);

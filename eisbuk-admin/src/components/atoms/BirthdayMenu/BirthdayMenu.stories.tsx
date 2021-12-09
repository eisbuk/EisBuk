import React from "react";

import BirthdayMenu from "./BirthdayMenu";

import { saul, walt } from "@/__testData__/customers";

export default {
  title: "Birthday Menu",
  component: BirthdayMenu,
};
const customers = { "12-12-2020": [saul, walt] };
export const Default = (): JSX.Element => (
  <BirthdayMenu customers={customers} />
);

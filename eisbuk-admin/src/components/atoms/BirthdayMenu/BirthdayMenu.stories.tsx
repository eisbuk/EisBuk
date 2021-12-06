import React from "react";

import BirthdayMenu from "./BirthdayMenu";

import { saul, walt } from "@/__testData__/customers";

export default {
  title: "Birthday Menu",
  component: BirthdayMenu,
};

export const Default = (): JSX.Element => (
  <BirthdayMenu customers={[saul, walt]} />
);

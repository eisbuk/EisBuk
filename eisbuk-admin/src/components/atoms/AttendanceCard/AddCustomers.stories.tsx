import React from "react";
import { ComponentMeta } from "@storybook/react";

import { Category } from "eisbuk-shared";

import AddCustomersList from "./AddCustomers";

import { allCustomers } from "./__testData__/dummyData";

export default {
  title: "Attendance: Add Customers List",
  component: AddCustomersList,
} as ComponentMeta<typeof AddCustomersList>;

const filteredCustomers = [
  ...allCustomers,
  ...allCustomers,
  ...allCustomers,
  ...allCustomers,
  ...allCustomers,
  ...allCustomers,
  ...allCustomers,
  ...allCustomers,
  ...allCustomers,
  ...allCustomers,
  ...allCustomers,
].filter(({ category }) => category === Category.Course);

export const Default = (): JSX.Element => (
  <AddCustomersList
    open={true}
    customers={filteredCustomers}
    onClose={() => {}}
    onAddCustomer={() => {}}
  />
);

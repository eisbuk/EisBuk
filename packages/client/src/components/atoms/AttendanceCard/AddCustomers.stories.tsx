import React from "react";
import { ComponentMeta } from "@storybook/react";

import AddCustomersList from "./AddCustomers";

import { allCustomers } from "@/__testData__/attendance";

export default {
  title: "Attendance: Add Customers List",
  component: AddCustomersList,
} as ComponentMeta<typeof AddCustomersList>;

const additionalCustomers = [
  { name: "Testio", surname: "Test" },
  { name: "Bertrum", surname: "Gilfoyle" },
  { name: "Rajesh", surname: "Koothrapali" },
  { name: "Sheldon", surname: "Cooper" },
  { name: "Richard", surname: "Hendricks" },
  { name: "Kanye", surname: "West" },
  { name: "North", surname: "West" },
  { name: "South", surname: "West" },
  { name: "West", surname: "West" },
].map(({ name, surname }, i) => ({
  ...allCustomers[0],
  name,
  surname,
  id: `${name}-${i}`,
}));

export const Default = (): JSX.Element => (
  <AddCustomersList
    open={true}
    customers={[...allCustomers, ...additionalCustomers]}
    onClose={() => {}}
    onAddCustomer={() => {}}
  />
);

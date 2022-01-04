import React from "react";
import { ComponentMeta } from "@storybook/react";

import Paper from "@material-ui/core/Paper";

import * as customersObj from "@/__testData__/customers";
import CustomerGrid from "./CustomerGrid";

export default {
  title: "Customer Griddd",
  component: CustomerGrid,
} as ComponentMeta<typeof CustomerGrid>;

const customers = Object.values(customersObj);

export const Default = (): JSX.Element => (
  <Paper elevation={3}>
    <CustomerGrid {...{ customers }} />
  </Paper>
);

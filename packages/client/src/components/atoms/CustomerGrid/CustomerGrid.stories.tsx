import React from "react";
import { ComponentMeta } from "@storybook/react";

import Paper from "@mui/material/Paper";

import * as customersObj from "@/__testData__/customers";
import CustomerGrid from "./CustomerGrid";

export default {
  title: "Customer Grid",
  component: CustomerGrid,
} as ComponentMeta<typeof CustomerGrid>;

const customers = Object.values(customersObj);

export const Default = (): JSX.Element => (
  <Paper elevation={3}>
    <CustomerGrid
      customers={[
        ...customers,
        {
          ...customers[0],
          id: "grzegorz",
          name: "Grzegorz",
          surname: "Brzęczyszczykiewicz",
        },
      ]}
    />
  </Paper>
);

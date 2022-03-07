import React from "react";
import { ComponentMeta } from "@storybook/react";

import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";

import CustomerList from "./CustomerList";

import * as customersObj from "@/__testData__/customers";

export default {
  title: "Customer List",
  component: CustomerList,
} as ComponentMeta<typeof CustomerList>;

const customers = Object.values(customersObj);

export const Default = (): JSX.Element => (
  <Container maxWidth="sm">
    <Paper elevation={3}>
      <CustomerList {...{ customers }} />
    </Paper>
  </Container>
);

import React from "react";
import { ComponentMeta } from "@storybook/react";

import CustomerCard from "./CustomerCard";

import { walt } from "@/__testData__/customers";

export default {
  title: "Customer Dialog",
  component: CustomerCard,
} as ComponentMeta<typeof CustomerCard>;

export const Default = (): JSX.Element => (
  <CustomerCard customer={walt} onClose={(): void => {}} />
);

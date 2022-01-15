import React from "react";
import { ComponentMeta } from "@storybook/react";

import CustomerDialog from "./CustomerDialog";

import { walt } from "@/__testData__/customers";

export default {
  title: "Customer Dialog",
  component: CustomerDialog,
} as ComponentMeta<typeof CustomerDialog>;

export const Default = (): JSX.Element => (
  <CustomerDialog customer={walt} onClose={(): void => {}} />
);

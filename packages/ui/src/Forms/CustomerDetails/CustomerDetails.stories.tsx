import React from "react";
import { ComponentMeta } from "@storybook/react";

import CustomerDetails from "./CustomerDetails";

export default {
  title: "Forms / Customer Details",
  component: CustomerDetails,
} as ComponentMeta<typeof CustomerDetails>;

export const Default = (): JSX.Element => (
  <>
    <CustomerDetails />
  </>
);

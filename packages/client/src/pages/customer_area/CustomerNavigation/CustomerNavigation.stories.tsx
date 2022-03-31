import React from "react";
import { ComponentMeta } from "@storybook/react";

import CustomerNavigation from "./CustomerNavigation";

export default {
  title: "Customer Navigation",
  component: CustomerNavigation,
} as ComponentMeta<typeof CustomerNavigation>;

export const Default = (): JSX.Element => <CustomerNavigation />;

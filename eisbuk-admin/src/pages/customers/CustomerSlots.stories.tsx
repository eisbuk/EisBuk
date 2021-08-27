import React from "react";
import { ComponentMeta } from "@storybook/react";

import CustomerSlots from "./CustomerSlots";

import { slotsMonth } from "@/__testData__/dummyData";

export default {
  title: "Book Ice Page",
  component: CustomerSlots,
} as ComponentMeta<typeof CustomerSlots>;

export const Default = (): JSX.Element => <CustomerSlots slots={slotsMonth} />;

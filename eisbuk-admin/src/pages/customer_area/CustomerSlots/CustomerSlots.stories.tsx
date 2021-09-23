import React from "react";
import { ComponentMeta } from "@storybook/react";

import { CustomerRoute } from "@/enums/routes";

import CustomerSlots from "./CustomerSlots";

import { slotsMonth, slotsWeek } from "@/__testData__/dummyData";

export default {
  title: "Customer Routes",
  component: CustomerSlots,
} as ComponentMeta<typeof CustomerSlots>;

export const BookIce = (): JSX.Element => (
  <CustomerSlots
    slots={slotsMonth}
    view={CustomerRoute.BookIce}
    customerId="customer-0"
  />
);

export const BookOffIce = (): JSX.Element => (
  <CustomerSlots
    slots={slotsWeek}
    view={CustomerRoute.BookOffIce}
    customerId="customer-0"
  />
);

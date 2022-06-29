import React from "react";
import { ComponentMeta } from "@storybook/react";

import { CustomerRoute } from "@/enums/routes";

import CustomerSlots from "./CustomerSlots";

import { slotsMonth, slotsWeek } from "@/__testData__/slots";

export default {
  title: "Customer Routes",
  component: CustomerSlots,
} as ComponentMeta<typeof CustomerSlots>;

export const BookIce = (): JSX.Element => (
  <CustomerSlots
    rawSlots={slotsMonth}
    slots={slotsMonth}
    view={CustomerRoute.BookIce}
  />
);

export const BookOffIce = (): JSX.Element => (
  <CustomerSlots
    rawSlots={slotsMonth}
    slots={slotsWeek}
    view={CustomerRoute.BookOffIce}
  />
);

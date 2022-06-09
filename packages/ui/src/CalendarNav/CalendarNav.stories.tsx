import React from "react";
import { ComponentMeta } from "@storybook/react";

import CalendarNav from "./CalendarNav";

export default {
  title: "Calendar Nav",
  component: CalendarNav,
} as ComponentMeta<typeof CalendarNav>;

export const Default = (): JSX.Element => <CalendarNav />;

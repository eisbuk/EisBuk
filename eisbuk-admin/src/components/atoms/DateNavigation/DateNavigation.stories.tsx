import React from "react";
import { ComponentMeta } from "@storybook/react";

import DateNavigation from "./DateNavigation";

export default {
  title: "Date Navigation",
  component: DateNavigation,
} as ComponentMeta<typeof DateNavigation>;

export const Default = (): JSX.Element => <DateNavigation />;

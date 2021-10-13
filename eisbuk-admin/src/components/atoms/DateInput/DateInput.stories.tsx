import React from "react";
import { ComponentMeta } from "@storybook/react";

import DateInput from "./DateInput";

export default {
  title: "Date Input",
  component: DateInput,
} as ComponentMeta<typeof DateInput>;

export const Default = (): JSX.Element => <DateInput />;

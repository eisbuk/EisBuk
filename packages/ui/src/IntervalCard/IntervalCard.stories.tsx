import React from "react";
import { ComponentMeta } from "@storybook/react";

import IntervalCard from "./IntervalCard";

export default {
  title: "Interval Card",
  component: IntervalCard,
} as ComponentMeta<typeof IntervalCard>;

export const Default = (): JSX.Element => <IntervalCard />;

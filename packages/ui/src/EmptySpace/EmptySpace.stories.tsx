import React from "react";
import { ComponentMeta } from "@storybook/react";

import EmptySpace from "./EmptySpace";

export default {
  title: "Empty Space",
  component: EmptySpace,
} as ComponentMeta<typeof EmptySpace>;

export const Default = (): JSX.Element => (
  <EmptySpace className="max-w-md">{`No slots are currently available for the month of <strong>May</strong>`}</EmptySpace>
);

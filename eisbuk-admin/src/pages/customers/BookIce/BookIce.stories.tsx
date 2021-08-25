import React from "react";
import { ComponentMeta } from "@storybook/react";

import BookIce from "./BookIce";

export default {
  title: "Book Ice Page",
  component: BookIce,
} as ComponentMeta<typeof BookIce>;

export const Default = (): JSX.Element => <BookIce />;

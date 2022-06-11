import React from "react";
import { ComponentMeta } from "@storybook/react";

import Layout from "./Layout";

export default {
  title: "Layout",
  component: Layout,
} as ComponentMeta<typeof Layout>;

export const Default = (): JSX.Element => <Layout />;

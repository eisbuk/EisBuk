import React from "react";
import { ComponentMeta } from "@storybook/react";

import { AccountCircle, Calendar } from "@eisbuk/svg";

import { StorybookGrid, StorybookItem } from "../utils/storybook";

import TabItem from "./TabItem";

export default {
  title: "TabItem",
  component: TabItem,
} as ComponentMeta<typeof TabItem>;

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <StorybookGrid>
      <StorybookItem>
        <TabItem Icon={AccountCircle} label="Book" />
      </StorybookItem>
      <StorybookItem>
        <TabItem Icon={Calendar} label="Calendar" />
      </StorybookItem>
    </StorybookGrid>
    <h1 className="text-lg font-bold mb-4">Active</h1>
    <StorybookGrid>
      <StorybookItem>
        <TabItem Icon={AccountCircle} label="Book" active={true} />
      </StorybookItem>
      <StorybookItem>
        <TabItem Icon={Calendar} label="Calendar" active={true} />
      </StorybookItem>
    </StorybookGrid>
  </>
);

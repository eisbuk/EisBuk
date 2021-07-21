import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import Unauthorized from "@/components/auth/Unauthorized";

export default {
  title: "Unauthorized page",
  component: Unauthorized,
} as ComponentMeta<typeof Unauthorized>;

const Template: ComponentStory<typeof Unauthorized> = (args) => (
  <Unauthorized {...args} />
);

export const Default = Template.bind({});
Default.args = {
  backgroundIndex: 0,
};

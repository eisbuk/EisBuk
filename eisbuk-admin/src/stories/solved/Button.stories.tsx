import React from "react";
import { Button } from "@/stories/solved/Button";
import { ComponentStory, ComponentMeta } from "@storybook/react";

export default {
  title: "Button",
  component: Button,
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args): JSX.Element => (
  <Button {...args} />
);

export const Default = Template.bind({});
Default.args = {};

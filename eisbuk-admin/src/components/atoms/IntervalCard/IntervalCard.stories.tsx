import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import IntervalCard from "./IntervalCard";

import { baseProps } from "./__testData__/dummyData";

export default {
  title: "Interval Card",
  component: IntervalCard,
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
} as ComponentMeta<typeof IntervalCard>;

const Template: ComponentStory<typeof IntervalCard> = (args) => (
  <IntervalCard {...args} />
);

export const Default = Template.bind({});
Default.args = {
  ...baseProps,
};

import { CustomerRoute } from "@/enums/routes";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import CustomerAreaCalendar from "./CustomerAreaCalendar";

export default {
  title: "Slots Page Container",
  component: CustomerAreaCalendar,
} as ComponentMeta<typeof CustomerAreaCalendar>;

const Template: ComponentStory<typeof CustomerAreaCalendar> = (args) => (
  <CustomerAreaCalendar {...args} />
);

export const bookIce = Template.bind({});
bookIce.args = {
  view: CustomerRoute.BookIce,
};

export const bookOffIce = Template.bind({});
bookOffIce.args = {
  view: CustomerRoute.BookOffIce,
};

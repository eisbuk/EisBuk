import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import CustomerForm from "@/components/customers/CustomerForm";

export default {
  title: "Customer form",
  component: CustomerForm,
  argTypes: {
    updateCustomer: { action: "Customer update" },
    handleClose: { action: "modal closed" },
  },
} as ComponentMeta<typeof CustomerForm>;

const Template: ComponentStory<typeof CustomerForm> = (
  args: Omit<Parameters<typeof CustomerForm>[0], "open">
) => <CustomerForm open={true} {...args} />;

export const Empty = Template.bind({});

export const EditForm = Template.bind({});
EditForm.args = {
  customer: {
    name: "Gustavo",
    surname: "Fring",
    email: "gus@los-pollos-hermanos.com",
    birthday: "1958-04-26",
  },
};

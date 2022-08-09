import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import CustomerForm from "./CustomerForm";
import { ModalContainer } from "@/features/modal/components";

export default {
  title: "Customer forms",
  component: CustomerForm,
  argTypes: {
    updateCustomer: { action: "Customer update" },
    handleClose: { action: "modal closed" },
  },
  decorators: [
    (Story) => (
      <ModalContainer>
        <Story />
      </ModalContainer>
    ),
  ],
} as ComponentMeta<typeof CustomerForm>;

const Template: ComponentStory<typeof CustomerForm> = (
  args: Omit<Parameters<typeof CustomerForm>[0], "open">
) => <CustomerForm {...args} />;

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

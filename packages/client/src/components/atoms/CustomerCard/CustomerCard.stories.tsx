import React from "react";
import { ComponentMeta } from "@storybook/react";

import CustomerCard from "./CustomerCard";
import { ModalContainer } from "@/features/modal/components";

import { walt } from "@/__testData__/customers";

export default {
  title: "Customer Dialog",
  component: CustomerCard,
  decorators: [
    (Story) => (
      <ModalContainer>
        <Story />
      </ModalContainer>
    ),
  ],
} as ComponentMeta<typeof CustomerCard>;

export const Default = (): JSX.Element => (
  <CustomerCard customer={walt} onClose={(): void => {}} />
);

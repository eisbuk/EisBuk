import React from "react";

import BirthdayDialog from "./BirthdayDialog";
import { ModalContainer } from "@/features/modal/components";
import * as customersRecord from "@/__testData__/customers";

export default {
  title: "Birthday Dialog",
  component: BirthdayDialog,
};

const customers = [
  {
    birthday: "12-12",
    customers: Object.values(customersRecord).map((customer) => ({
      ...customer,
      birthday: "2020-12-12",
    })),
  },
  {
    birthday: "12-13",
    customers: Object.values(customersRecord).map((customer) => ({
      ...customer,
      birthday: "2020-12-13",
    })),
  },
];

export const Default = () => (
  <ModalContainer>
    <BirthdayDialog {...{ customers }} />
  </ModalContainer>
);

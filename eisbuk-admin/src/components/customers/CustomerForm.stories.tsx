import React from "react";
import CustomerForm from "./CustomerForm";

export default {
  title: "Customer forms",
  component: CustomerForm,
};

const baseProps = {
  open: true,
};

const heisenberg = {
  name: "Walter",
  surname: "White",
  email: "heisenberg@im-the-one-who-knocks.com",
  birth: "1958-09-07",
};

export const Empty = (): JSX.Element => <CustomerForm {...baseProps} />;

export const EditForm = (): JSX.Element => (
  <CustomerForm {...baseProps} customer={heisenberg} />
);

/** @TODO check below, this is the old code */
// const Template = (args) => <CustomerForm open={true} {...args} />;

// export const Empty = Template.bind({});
// Empty.argTypes = {
//   updateCustomer: { action: "Customer update" },
//   handleClose: { action: "modal closed" },
// };

// export const EditForm = Template.bind({});
// EditForm.args = {
//   customer: {
//     name: "Gustavo",
//     surname: "Fring",
//     email: "gus@los-pollos-hermanos.com",
//     birth: "1958-04-26",
//   },
// };
// EditForm.argTypes = Empty.argTypes;

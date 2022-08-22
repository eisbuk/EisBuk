import React from "react";
import { ComponentMeta } from "@storybook/react";

import CustomerProfileForm from "./CustomerProfileForm";

export default {
  title: "Forms / Customer Profile Form",
  component: CustomerProfileForm,
} as ComponentMeta<typeof CustomerProfileForm>;

const customer = {
  name: "Jim",
  surname: "Jarvis",
  email: "JJBean@jarvis.com",
  phone: "+44 78930 788900",
  birthday: "12/12/2012",
  certificateExpiration: "19/03/2021",
  covidCertificateReleaseDate: "",
  covidCertificateSuspended: true,
};

export const Default = (): JSX.Element => (
  <CustomerProfileForm customer={customer} />
);
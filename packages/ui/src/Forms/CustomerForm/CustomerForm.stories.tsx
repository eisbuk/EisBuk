import React from "react";
import { ComponentMeta } from "@storybook/react";

import { CustomerForm } from "./index";

import { Category } from "@eisbuk/shared";

export default {
  title: "Forms / Customer Profile Form",
  component: CustomerForm.Profile,
} as ComponentMeta<typeof CustomerForm.Profile>;

const customer = {
  id: "123456",
  categories: [Category.Competitive],
  name: "Jim",
  surname: "Jarvis",
  email: "JJBean@jarvis.com",
  phone: "+44 78930 788900",
  birthday: "2012-12-12",
  certificateExpiration: "2021-19-03",
  covidCertificateReleaseDate: "",
  covidCertificateSuspended: true,
  subscriptionNumber: "123456",
  extendedDate: "2022-01-01",
};

export const Default = (): JSX.Element => (
  <CustomerForm.Profile customer={customer} />
);

export const SelfRegistration = (): JSX.Element => (
  <CustomerForm.SelfReg customer={customer} />
);

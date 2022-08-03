import React from "react";
import { ComponentMeta } from "@storybook/react";

import CustomerDetails from "./CustomerProfileForm";

export default {
  title: "Forms / Customer Details",
  component: CustomerDetails,
} as ComponentMeta<typeof CustomerDetails>;

const customer = {
  name: "Jim",
  surname: "Jarvis",
  email: "JJBean@jarvis.com",
  phone: "",
  birthday: "",
  certificateExpiration: "",
  covidCertificateReleaseDate: "",
  covidCertificateSuspended: true,
};

export const Default = (): JSX.Element => (
  <>
    <CustomerDetails customer={customer} />
  </>
);

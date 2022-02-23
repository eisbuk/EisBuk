import React from "react";
import { ComponentMeta } from "@storybook/react";
import OrganizationSettings from "./OrganizationSettings";

export default {
  title: "Organization Settings",
  component: OrganizationSettings,
} as ComponentMeta<typeof OrganizationSettings>;

const organization = {
  admins: ["Walt", "Gus"],
  organizationName: "Los Pollos Hermanos",
  smtpUri: "gusfring:password@smtpserver:8080",
  emailFrom: "gus@lospollos.me",
  emailNameFrom: "Gustavo",
  emailTemplate: "\n \n \n",
  smsFrom: "Gus",
  smsTemplate: "\n \n \n",
  smsUrl: "sms url example",
};
export const Default = (): JSX.Element => (
  <OrganizationSettings organization={organization} />
);

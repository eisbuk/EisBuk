import React from "react";
import { ComponentMeta } from "@storybook/react";
import OrganizationSettings from "./OrganizationSettings";

export default {
  title: "Organization Settings",
  component: OrganizationSettings,
} as ComponentMeta<typeof OrganizationSettings>;

const organization = {
  admins: ["Walt", "Gus"],
  displayName: "Los Pollos Hermanos",
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

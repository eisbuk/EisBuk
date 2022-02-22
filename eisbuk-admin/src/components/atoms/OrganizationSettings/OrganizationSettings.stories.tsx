import React from "react";
import { ComponentMeta } from "@storybook/react";
import OrganizationSettings from "./OrganizationSettings";

export default {
  title: "Organization Settings",
  component: OrganizationSettings,
} as ComponentMeta<typeof OrganizationSettings>;

const organization = {
  admins: ["Walt", "Gus"],
  organizationName: "Los Pollos",
  smtpUri: "gusfring:password@smtpserver:8080",
  emailFrom: "gus@lospollos.me",
  emailSender: "Gustavo",
  emailTemplate:
    "This is An Email Template and it needs to be longer than usual to test out multiline fields.",
  smsFrom: "Gus",
  smsTemplate:
    "This is An SMS Template and it needs to be even longer than usual to test out multiline fields.",
  smsUrl: "sms url example",
};
export const Default = (): JSX.Element => (
  <OrganizationSettings organization={organization} />
);

import React from "react";
import { ComponentMeta } from "@storybook/react";
import OrganizationSettings from "./OrganizationSettings";

export default {
  title: "Organization Settings",
  component: OrganizationSettings,
} as ComponentMeta<typeof OrganizationSettings>;

const organization = {
  admins: ["Walt", "Gus"],
  name: "Los Pollos",
  SMTPURI: "gusfring:password@smtpserver:8080",
  EmailFrom: "gus@lospollos.me",
  NameFrom: "Gustavo",
  EmailTemplate:
    "This is An Email Template and it needs to be longer than usual to test out multiline fields.",
  SMSFrom: "Gus",
  SMSTemplate:
    "This is An SMS Template and it needs to be longer than usual to test out multiline fields.",
};
export const Default = (): JSX.Element => (
  <OrganizationSettings organization={organization} />
);

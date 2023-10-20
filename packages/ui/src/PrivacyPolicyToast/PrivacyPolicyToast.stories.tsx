import React from "react";
import { ComponentMeta } from "@storybook/react";

import PrivacyPolicyToast from "./PrivacyPolicyToast";

export default {
  title: "Privacy Policy Toast",
  component: PrivacyPolicyToast,
} as ComponentMeta<typeof PrivacyPolicyToast>;

export const Default = (): JSX.Element => <PrivacyPolicyToast />;

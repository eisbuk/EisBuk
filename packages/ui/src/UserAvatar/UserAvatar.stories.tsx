import React from "react";
import { ComponentMeta } from "@storybook/react";

import UserAvatar from "./UserAvatar";

export default {
  title: "User Avatar",
  component: UserAvatar,
} as ComponentMeta<typeof UserAvatar>;

export const Default = (): JSX.Element => (
  <UserAvatar name="Salvo" surname="Simonetti" />
);

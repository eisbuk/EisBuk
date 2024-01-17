import React from "react";
import { ComponentMeta } from "@storybook/react";

import DropdownMenu from "./DropdownMenu";
import { Default as AthleteAvatarMenu } from "../AthleteAvatarMenu/AthleteAvatarMenu.stories";

import { UserAvatar } from "../UserAvatar";

export default {
  title: "Dropdown Menu",
  component: DropdownMenu,
} as ComponentMeta<typeof DropdownMenu>;

export const Default = (): JSX.Element => {
  return (
    <div className="bg-gray-800 w-full p-4 flex items-start h-screen justify-end">
      <DropdownMenu content={<AthleteAvatarMenu />}>
        <UserAvatar
          name="Salvo"
          surname="Simonetti"
          photoURL="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        />
      </DropdownMenu>
    </div>
  );
};

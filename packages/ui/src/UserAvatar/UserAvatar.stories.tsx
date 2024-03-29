import React from "react";
import { ComponentMeta } from "@storybook/react";

import UserAvatar from "./UserAvatar";

export default {
  title: "User Avatar",
  component: UserAvatar,
} as ComponentMeta<typeof UserAvatar>;

export const Default = (): JSX.Element => (
  <div className="flex flex-col space-y-6">
    <div>
      <h1 className="text-lg font-bold mb-4">Avatar</h1>
      <div className="flex items-center justify-end max-w-max bg-gray-800 p-4">
        <UserAvatar
          name="Salvo"
          surname="Simonetti"
          photoURL="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        />
      </div>
    </div>
    <div>
      <h1 className="text-lg font-bold mb-4">
        Avatar with shortened long name
      </h1>
      <div className="flex items-center justify-end max-w-max bg-gray-800 p-4">
        <UserAvatar
          name="Pablo Emilio"
          surname="Escobar Gaviria"
          photoURL="https://cdn.britannica.com/62/192062-131-96B933EF/mug-shot-Colombia-control-agency-Medellin.jpg"
        />
      </div>
    </div>
    <div>
      <h1 className="text-lg font-bold mb-4">No Image</h1>
      <div className="flex items-center justify-end max-w-max bg-gray-800 p-4">
        <UserAvatar name="Salvo" surname="Simonetti" />
      </div>
    </div>
    <div>
      <h1 className="text-lg font-bold mb-4">No Props</h1>
      <div className="flex items-center justify-end max-w-max bg-gray-800 p-4">
        <UserAvatar />
      </div>
    </div>
  </div>
);

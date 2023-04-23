import React from "react";
import { ComponentMeta } from "@storybook/react";

import { BadgeSize, CustomerAvatar } from "./CustomerAvatar";

export default {
  title: "Customer Avatar",
  component: CustomerAvatar,
} as ComponentMeta<typeof CustomerAvatar>;

const customer = {
  photoURL:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};

export const Default = (): JSX.Element => (
  <div className="flex flex-col space-y-6">
    <div>
      <h1 className="text-lg font-bold mb-4">Default</h1>
      <div className="flex items-center justify-end max-w-max bg-gray-800 p-4">
        <CustomerAvatar customer={customer} />
      </div>
    </div>
    <div>
      <h1 className="text-lg font-bold mb-4">Larger</h1>
      <div className="flex items-center justify-end max-w-max bg-gray-800 p-4">
        <CustomerAvatar
          className="h-14 w-14"
          customer={customer}
          badgeSize={BadgeSize.MD}
        />
      </div>
    </div>
    <div>
      <h1 className="text-lg font-bold mb-4">Large</h1>
      <div className="flex items-center justify-end max-w-max bg-gray-800 p-4">
        <CustomerAvatar
          customer={customer}
          className="h-40 w-40"
          badgeSize={BadgeSize.LG}
        />
      </div>
    </div>
  </div>
);

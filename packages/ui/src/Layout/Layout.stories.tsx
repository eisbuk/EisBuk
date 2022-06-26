import React from "react";
import { ComponentMeta } from "@storybook/react";

import { AccountCircle, Calendar } from "@eisbuk/svg";

import Layout from "./Layout";
import TabItem from "../TabItem";
import NotificationToast, {
  NotificationToastVariant,
} from "../NotificationToast";

export default {
  title: "Layout",
  component: Layout,
} as ComponentMeta<typeof Layout>;

const additionalButtons = (
  <>
    <TabItem Icon={AccountCircle} label="Book" active={true} />
    <TabItem Icon={Calendar} label="Calendar" />
  </>
);

const Notifications: React.FC<{ className?: string }> = ({ className }) => (
  <NotificationToast
    {...{ className }}
    variant={NotificationToastVariant.Success}
  >
    {`April 13th 08:00 - 09:00, <strong>confirmed</strong>`}
  </NotificationToast>
);

const user = {
  name: "Salvo",
  surname: "Simonetti",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};
export const Default = (): JSX.Element => <Layout {...{ user }} />;

export const CustomerArea = (): JSX.Element => (
  <Layout {...{ additionalButtons, Notifications, user }}>
    <div className="content-container">
      <div className="md:px-[44px]">
        {Array(8)
          .fill(null)
          .map((_, i) => (
            <div
              key={i}
              className="w-full h-40 my-4 bg-gray-100 border-2 border-gray-200 rounded-md md:h-80"
            />
          ))}
      </div>
    </div>
  </Layout>
);

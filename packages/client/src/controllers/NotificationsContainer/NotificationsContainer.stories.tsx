import React, { useRef, useState } from "react";
import { ComponentMeta } from "@storybook/react";
import { v4 as uuid } from "uuid";

import { Layout } from "@eisbuk/ui";

import { NotifVariant } from "@/enums/store";

import NotificationsContainer from "./NotificationsContainer";

export default {
  title: "Notifications Container",
  component: NotificationsContainer,
} as ComponentMeta<typeof NotificationsContainer>;

export const Default = (): JSX.Element => {
  const [active, setActive] = useState<
    | {
        key: string;
        message: string;
        variant: NotifVariant;
      }
    | undefined
  >();

  const variants = Object.values(NotifVariant);

  const nextVariant = useRef(0);

  const generateNotif = () => {
    const key = uuid();
    const message = "Hello";
    const variant = variants[nextVariant.current];
    nextVariant.current = (nextVariant.current + 1) % 2;
    setActive({ key, message, variant });
  };

  const clearNotif = () => {
    setActive(undefined);
  };

  return (
    <div>
      <Layout
        Notifications={({ className }) => (
          <NotificationsContainer className={className} active={active} />
        )}
      />
      <br />
      <button
        className="bg-gray-200 rounded-md px-4 py-1 m-2"
        onClick={generateNotif}
      >
        Generate notif
      </button>
      <button
        className="bg-gray-200 rounded-md px-4 py-1 m-2"
        onClick={clearNotif}
      >
        Clear notif
      </button>
    </div>
  );
};

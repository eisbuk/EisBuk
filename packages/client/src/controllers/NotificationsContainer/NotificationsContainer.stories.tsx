import React, { useRef } from "react";
import { ComponentMeta } from "@storybook/react";
import { Provider as StoreProvider } from "react-redux";

import { Layout } from "@eisbuk/ui";

import { NotifVariant } from "@/enums/store";

import { getNewStore } from "@/store/createStore";
import { enqueueNotification } from "@/store/actions/notificationsActions";

import NotificationsContainer from "./NotificationsContainer";
import { NotificationsProvider } from "@/controllers/NotificationsContainer/NotificationsContext";

export default {
  title: "Notifications Container",
  component: NotificationsContainer,
} as ComponentMeta<typeof NotificationsContainer>;

const store = getNewStore();

export const Default = (): JSX.Element => {
  const variants = Object.values(NotifVariant);

  const nextVariant = useRef(0);

  const generateNotif = () => {
    const message = "Hello";
    const variant = variants[nextVariant.current];
    nextVariant.current = (nextVariant.current + 1) % 2;
    store.dispatch(enqueueNotification({ message, variant }));
  };

  return (
    <StoreProvider store={store}>
      <NotificationsProvider timeouts={{ minTimeout: 1200, maxTimeout: 2000 }}>
        <Layout Notifications={NotificationsContainer}>
          <br />
          <button
            className="bg-gray-200 rounded-md px-4 py-1 m-2"
            onClick={generateNotif}
          >
            Enqueue notif
          </button>
        </Layout>
      </NotificationsProvider>
    </StoreProvider>
  );
};

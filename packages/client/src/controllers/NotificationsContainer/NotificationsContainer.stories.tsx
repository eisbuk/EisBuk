import React, { useRef } from "react";
import { ComponentMeta } from "@storybook/react";
import { Provider as StoreProvider } from "react-redux";

import { Layout } from "@eisbuk/ui";

import { NotifVariant } from "@/enums/store";

import { getNewStore } from "@/store/createStore";
import {
  enqueueNotification,
  evictNotification,
} from "@/store/actions/notificationsActions";

import NotificationsContainer from "./NotificationsContainer";

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

  const clearNotif = () => {
    store.dispatch(evictNotification());
  };

  return (
    <StoreProvider store={store}>
      <Layout Notifications={NotificationsContainer} />
      <br />
      <button
        className="bg-gray-200 rounded-md px-4 py-1 m-2"
        onClick={generateNotif}
      >
        Enqueue notif
      </button>
      <button
        className="bg-gray-200 rounded-md px-4 py-1 m-2"
        onClick={clearNotif}
      >
        Next notif
      </button>
    </StoreProvider>
  );
};

import React from "react";
import { ComponentMeta } from "@storybook/react";

import NotificationToast, {
  NotificationToastVariant,
} from "./NotificationToast";

export default {
  title: "Notification Toast",
  component: NotificationToast,
} as ComponentMeta<typeof NotificationToast>;

export const Variants = (): JSX.Element => (
  <>
    <NotificationToast
      variant={NotificationToastVariant.Success}
      className="max-w-md mb-3"
    >{`April 13th 08:00 - 09:00, <strong>confirmed</strong>`}</NotificationToast>
    <NotificationToast
      variant={NotificationToastVariant.Error}
      className="max-w-md"
    >{`April 13th 08:00 - 09:00, <strong>cancelled</strong>`}</NotificationToast>
  </>
);

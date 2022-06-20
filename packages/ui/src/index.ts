// Main CSS is imported here to signal the bundler the usage of Tailwind
// in order to generate a PostCSS built css file next to the bundle
import "./main.css";

import TestComponent from "./TestComponent";
import EmptySpace from "./EmptySpace";
import NotificationToast from "./NotificationToast";
import Button from "./Button";
import SlotTypeIcon from "./SlotTypeIcon";
import TabItem from "./TabItem";
import CalendarNav from "./CalendarNav";
import Layout from "./Layout";

export * from "./UserAvatar";
export * from "./NotificationToast";
export * from "./Button";

export {
  TestComponent,
  NotificationToast,
  EmptySpace,
  Button,
  Layout,
  TabItem,
  CalendarNav,
  SlotTypeIcon,
};

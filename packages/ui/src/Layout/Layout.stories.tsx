import React from "react";
import { ComponentMeta } from "@storybook/react";
import { MemoryRouter as Router } from "react-router-dom";
import { DateTime } from "luxon";

import { EisbukLogo, AccountCircle, Calendar } from "@eisbuk/svg";

import Layout, { LayoutContent } from "./Layout";
import TabItem from "../TabItem";
import NotificationToast, {
  NotificationToastVariant,
} from "../NotificationToast";
import CalendarNav from "../CalendarNav";
import { UserAvatar } from "../UserAvatar";
import { DropdownMenu } from "../DropdownMenu";

import { Default as AthleteAvatarMenu } from "../AthleteAvatarMenu/AthleteAvatarMenu.stories";

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

const logo = (
  <div className="h-10 text-white">
    <EisbukLogo />
  </div>
);

const dummyContent = (
  <div className="content-container">
    <div className="md:px-[44px] pb-4">
      <h1 className="mt-8 mb-10 text-2xl font-semibold">Dummy Content</h1>
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
);
const adminLinks = [
  {
    label: "Attendance",
    Icon: Calendar,
    slug: "/attendance",
  },
  {
    label: "Slots",
    Icon: Calendar,
    slug: "/slots",
  },
  {
    label: "Athletes",
    Icon: Calendar,
    slug: "/athletes",
  },
];

const user = {
  name: "Salvo",
  surname: "Simonetti",
  photoURL:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};

const Avatar = () => (
  <DropdownMenu content={<AthleteAvatarMenu />}>
    <UserAvatar {...user} />
  </DropdownMenu>
);

export const Admin = (): JSX.Element => (
  <Router initialEntries={[{ pathname: "/attendance" }]}>
    <Layout logo={logo} adminLinks={adminLinks} isAdmin={true}>
      <CalendarNav date={DateTime.now()} jump="week" />
      <LayoutContent>{dummyContent}</LayoutContent>
    </Layout>
  </Router>
);

export const CustomerArea = (): JSX.Element => (
  <Router>
    <Layout
      logo={logo}
      {...{ additionalButtons, Notifications }}
      userAvatar={<Avatar />}
    >
      <CalendarNav date={DateTime.now()} jump="week" />
      <LayoutContent>{dummyContent}</LayoutContent>
    </Layout>
  </Router>
);

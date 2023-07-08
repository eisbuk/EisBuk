import React from "react";
import { useSelector } from "react-redux";

import { LinkItem, Layout, UserAvatarProps } from "@eisbuk/ui";
import { PrivateRoutes } from "@eisbuk/shared/ui";
import i18n, { NavigationLabel } from "@eisbuk/translations";
import { ClipboardList, Users, DocumentDuplicate, Cog } from "@eisbuk/svg";

import BirthdayMenu from "@/controllers/BirthdayMenu";
import { NotificationsContainer } from "@/features/notifications/components/index";

import { getIsAdmin } from "@/store/selectors/auth";

interface Props {
  user?: UserAvatarProps;
  additionalButtons?: JSX.Element;
  children?: React.ReactNode[] | React.ReactNode;
}

const LayoutController: React.FC<Props> = (params) => {
  const isAdmin = useSelector(getIsAdmin);

  return (
    <Layout
      {...params}
      isAdmin={isAdmin}
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={<BirthdayMenu />}
    />
  );
};

const adminLinks: LinkItem[] = [
  {
    Icon: ClipboardList,
    label: i18n.t(NavigationLabel.Attendance),
    slug: PrivateRoutes.Root,
  },
  {
    Icon: DocumentDuplicate,
    label: i18n.t(NavigationLabel.Slots),
    slug: PrivateRoutes.Slots,
  },
  {
    Icon: Users,
    label: i18n.t(NavigationLabel.Athletes),
    slug: PrivateRoutes.Athletes,
  },
  {
    Icon: Cog,
    label: i18n.t(NavigationLabel.OrganizationSettings),
    slug: PrivateRoutes.AdminPreferences,
  },
];

export default LayoutController;

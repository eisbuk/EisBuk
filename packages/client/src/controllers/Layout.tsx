import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { LinkItem, Layout } from "@eisbuk/ui";
import { PrivateRoutes } from "@eisbuk/shared/ui";
import i18n, { NavigationLabel } from "@eisbuk/translations";
import { ClipboardList, Users, DocumentDuplicate, Cog } from "@eisbuk/svg";

import BirthdayMenu from "@/controllers/BirthdayMenu";
import AthletesApproval from "@/controllers/AthletesApproval";
import SendBookingEmails from "@/controllers/SendBookingEmails";
import { NotificationsContainer } from "@/features/notifications/components/index";

import { signOut } from "@/store/actions/authOperations";

import { getIsAdmin } from "@/store/selectors/auth";
import { getOrgDisplayName } from "@/store/selectors/orgInfo";

type Props = {
  additionalButtons?: JSX.Element;
  children?: React.ReactNode[] | React.ReactNode;
  userAvatar?: JSX.Element;
};

const LayoutController: React.FC<Props> = (params) => {
  const dispatch = useDispatch();

  const isAdmin = useSelector(getIsAdmin);

  const displayName = useSelector(getOrgDisplayName);
  const logo = displayName ? (
    <h1 className="font-fredoka font-semibold text-3xl text-white print:hidden">
      {displayName}
    </h1>
  ) : null;

  const additionalAdminContent = (
    <React.Fragment>
      <BirthdayMenu />
      <AthletesApproval />
      <SendBookingEmails />
    </React.Fragment>
  );

  return (
    <Layout
      {...params}
      logo={logo}
      isAdmin={isAdmin}
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
      onLogout={() => dispatch(signOut())}
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

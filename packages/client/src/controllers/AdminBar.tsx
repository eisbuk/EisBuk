import React from "react";
import { useDispatch } from "react-redux";

import { LinkItem, AdminBar } from "@eisbuk/ui";
import i18n, { NavigationLabel } from "@eisbuk/translations";
import { ClipboardList, Users, DocumentDuplicate, Cog } from "@eisbuk/svg";
import { PrivateRoutes } from "@eisbuk/shared/ui";

import BirthdayMenu from "@/controllers/BirthdayMenu";
import AthletesApproval from "@/controllers/AthletesApproval";
import SendBookingEmails from "@/controllers/SendBookingEmails";

import { signOut } from "@/store/actions/authOperations";

const AdminHeader: React.FC<{ className?: string }> = ({ className = "" }) => {
  const dispatch = useDispatch();

  const additionalAdminContent = (
    <div className="flex gap-x-2 md:gap-x-0">
      <BirthdayMenu />
      <AthletesApproval />
      <SendBookingEmails />
    </div>
  );

  return (
    <AdminBar
      className={className}
      adminLinks={adminLinks}
      additionalContent={additionalAdminContent}
      onLogout={() => dispatch(signOut)}
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

export default AdminHeader;

import { LinkItem } from "@eisbuk/ui";
import i18n, { NavigationLabel } from "@eisbuk/translations";
import { ClipboardList, Users, DocumentDuplicate, Cog } from "@eisbuk/svg";

import { PrivateRoutes } from "@/enums/routes";

export const adminLinks: LinkItem[] = [
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

import { LinkItem } from "@eisbuk/ui";
import i18n, { NavigationLabel } from "@eisbuk/translations";
import { Calendar, People, LibraryBooks, Cog } from "@eisbuk/svg";

import { PrivateRoutes } from "@/enums/routes";

export const adminLinks: LinkItem[] = [
  {
    Icon: Calendar,
    label: i18n.t(NavigationLabel.Attendance),
    slug: PrivateRoutes.Root,
  },
  {
    Icon: LibraryBooks,
    label: i18n.t(NavigationLabel.Slots),
    slug: PrivateRoutes.Slots,
  },
  {
    Icon: People,
    label: i18n.t(NavigationLabel.Athletes),
    slug: PrivateRoutes.Athletes,
  },
  {
    Icon: Cog,
    label: i18n.t(NavigationLabel.OrganizationSettings),
    slug: PrivateRoutes.AdminPreferences,
  },
];

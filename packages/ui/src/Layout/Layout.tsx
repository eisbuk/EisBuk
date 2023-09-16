import React from "react";

import { SVGComponent } from "@eisbuk/svg";

import { UserAvatar, UserAvatarProps } from "../UserAvatar";
import AdminBar from "./AdminBar";

interface LayoutProps {
  logo?: JSX.Element | null;
  user?: UserAvatarProps;
  additionalButtons?: JSX.Element;
  additionalAdminContent?: JSX.Element;
  Notifications?: React.FC<{ className?: string }>;
  children?: React.ReactNode[] | React.ReactNode;
  isAdmin?: boolean;
  adminLinks?: LinkItem[];
}
export interface LinkItem {
  Icon: SVGComponent;
  label: string;
  slug: string;
}

const Layout: React.FC<LayoutProps> = ({
  logo = null,
  additionalButtons,
  additionalAdminContent,
  user = {},
  Notifications,
  isAdmin = false,
  children,
  adminLinks,
}) => {
  return (
    <div className="absolute top-0 right-0 bottom-0 left-0 flex flex-col overflow-hidden">
      <header className="bg-gray-800">
        <div className="content-container">
          {isAdmin && adminLinks && (
            <AdminBar
              className={getHeaderRowClasses("top")}
              adminLinks={adminLinks}
              additionalContent={additionalAdminContent}
            />
          )}

          <div className={getHeaderRowClasses("top")}>
            <div>{logo}</div>
            {(user.name || user.surname || user.photoURL) && (
              <UserAvatar {...user} />
            )}
          </div>

          <div className="w-full h-[2px] bg-gray-700" />

          <div
            className={getHeaderRowClasses(
              "bottom",
              Boolean(additionalButtons)
            )}
          >
            <div className="w-full flex justify-center items-center gap-4 md:gap-3 md:justify-start md:max-w-1/2">
              {additionalButtons}
            </div>
            <div className="fixed z-50 bottom-[27px] left-4 right-4 md:static">
              {Notifications && <Notifications className="w-full md:w-auto" />}
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
};

export const LayoutContent: React.FC<{
  wide?: boolean;
  actionButtons: JSX.Element;
}> = ({ children, wide = false, actionButtons = null }) => (
  <main className="flex flex-col overflow-hidden">
    <div className={`overflow-y-auto ${wide ? "" : "content-container"}`}>
      {children}
    </div>
    {actionButtons && (
      <div className="border-t flex-grow-0 flex-shrink-0 py-2">
        <div className={wide ? "" : "content-container"}>{actionButtons}</div>
      </div>
    )}
  </main>
);

/** Get styles for top / botton row of the header */
const getHeaderRowClasses = (
  row: "top" | "bottom",
  hasAdditionalButtons?: boolean
) => {
  // Hide bottom row on mobile if it doesn't have 'additionalButtons'
  const displayClasses =
    row === "top" || hasAdditionalButtons ? ["flex"] : ["hidden", "md:flex"];

  // Styles used across both rows
  const baseClasses = [
    "w-full",
    "min-h-[70px]",
    "justify-between",
    "items-center",
  ];

  // Additional classes per row
  const additionalClasses = row === "top" ? [] : ["py-[15px]"];

  return [...displayClasses, ...baseClasses, ...additionalClasses].join(" ");
};

export default Layout;

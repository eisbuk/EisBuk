import React from "react";

import { EisbukLogo } from "@eisbuk/svg";

import UserAvatar, { UserAvatarProps } from "../UserAvatar";

interface LayoutProps {
  Logo?: React.FC;
  user?: UserAvatarProps;
  additionalButtons?: JSX.Element;
  Notifications?: React.FC<{ className?: string }>;
  children?: React.ReactNode[] | React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  Logo = EisbukLogo,
  additionalButtons,
  user,
  Notifications,
  children,
}) => {
  return (
    <div>
      <header className="bg-gray-800">
        <div className="content-container">
          <div className={getHeaderRowClasses("top")}>
            <div className="h-5 w-[86px] text-white">{<Logo />}</div>

            {user && <UserAvatar {...user} />}
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
            <div className="fixed bottom-[27px] left-4 right-4 md:static">
              {Notifications && <Notifications className="w-full md:w-auto" />}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
};

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

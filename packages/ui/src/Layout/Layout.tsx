import React from "react";

import { EisbukLogo } from "@eisbuk/svg";

import UserAvatar, { UserAvatarProps } from "../UserAvatar";

interface LayoutProps {
  user?: UserAvatarProps;
  additionalButtons?: JSX.Element;
  Notifications?: React.FC<{ className?: string }>;
}

const Layout: React.FC<LayoutProps> = ({
  additionalButtons,
  user,
  Notifications,
}) => {
  const rowClasses = "flex justify-between items-center w-full min-h-[70px]";

  return (
    <div className="bg-gray-800">
      <div className="content-container">
        <div className={rowClasses}>
          <div className="h-5 w-[86px] text-white">
            <EisbukLogo />
          </div>

          {user && <UserAvatar {...user} />}
        </div>

        <div className="w-full h-[2px] bg-gray-700" />

        <div className={[rowClasses, "py-[15px]"].join(" ")}>
          <div className="w-full flex justify-center gap-4 md:gap-3 md:justify-start md:max-w-1/2">
            {additionalButtons}
          </div>
          <div className="fixed bottom-[27px] left-4 right-4 md:static">
            {Notifications && <Notifications className="w-full md:w-auto" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;

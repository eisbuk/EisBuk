import React from "react";

import { EisbukLogo } from "@eisbuk/svg";

import UserAvatar, { UserAvatarProps } from "../UserAvatar";

interface LayoutProps {
  user?: UserAvatarProps;
  additionalButtons?: JSX.Element;
  notifications?: JSX.Element;
}

const Layout: React.FC<LayoutProps> = ({
  additionalButtons,
  user,
  notifications,
}) => {
  const rowClasses = "flex justify-between items-center w-full h-[70px]";

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

        <div className={rowClasses}>
          <div className="flex max-w-1/2 gap-[10px]">{additionalButtons}</div>
          <div>{notifications}</div>
        </div>
      </div>
    </div>
  );
};

export default Layout;

import React from "react";

import Avatar from "./Avatar";

import { shortName } from "../utils/helpers";

export interface UserAvatarProps {
  name?: string;
  surname?: string;
  photoURL?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = "",
  surname = "",
  photoURL,
}) => {
  const displayName = shortName(name, surname).join(" ");

  const containerClassNames = containerClasses.join(" ");
  const userNameClassNames = userNameClasses.join(" ");

  return (
    <div className={containerClassNames}>
      {displayName && (
        <div>
          <p className={userNameClassNames}>{displayName}</p>
        </div>
      )}

      <Avatar photoURL={photoURL} />
    </div>
  );
};

const containerClasses = [
  "flex",
  "min-w-min",
  "items-center",
  "space-x-4",
  "text-white",
  "select-none",
];

const userNameClasses = [
  "text-base",
  "leading-5",
  "font-medium",
  "text-right",
  "md:text-justify",
];

export default UserAvatar;

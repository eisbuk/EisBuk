import React, { useState } from "react";

import { User } from "@eisbuk/svg";

export interface UserAvatarProps {
  displayName?: string;
  photoURL?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ displayName, photoURL }) => {
  const [avatarUrl, setAvatarUrl] = useState(photoURL);

  const containerClassNames = containerClasses.join(" ");
  const userNameClassNames = userNameClasses.join(" ");
  const avatarClassNames = avatarClasses.join(" ");

  // Get avatar for display
  // default: if no valid 'photoURL' fall back to the placeholder
  const displayAvatar = avatarUrl ? (
    <img
      className="rounded-full object-cover"
      src={avatarUrl}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null;
        setAvatarUrl(undefined);
      }}
    />
  ) : (
    <div className="m-[-2px] mb-[-6px]">
      <User />
    </div>
  );

  return (
    <div className={containerClassNames}>
      {displayName && (
        <div>
          <p className={userNameClassNames}>{displayName}</p>
        </div>
      )}

      <div className={avatarClassNames}>{displayAvatar}</div>
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

const avatarClasses = [
  "flex",
  "items-center",
  "justify-center",
  "rounded-full",
  "h-10",
  "w-10",
  "bg-teal-400",
  "overflow-hidden",
];

export default UserAvatar;

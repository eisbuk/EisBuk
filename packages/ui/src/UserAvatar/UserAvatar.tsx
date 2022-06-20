import React, { useState } from "react";

import { CustomerBase } from "@eisbuk//shared";

interface UserAvatarProps extends Pick<CustomerBase, "name" | "surname"> {
  avatar?: string;
}

/**
 * Returns initials from provided name and last name
 * @param name
 * @param surname
 * @returns
 */
const getInitials = (name: string, surname: string): string =>
  `${name[0]}${surname[0]}`;

const UserAvatar: React.FC<UserAvatarProps> = ({ name, surname, avatar }) => {
  const [avatarUrl, setAvatarUrl] = useState(avatar);

  const containerClassNames = containerClasses.join(" ");
  const userNameClassNames = userNameClasses.join(" ");
  const avatarClassNames = avatarClasses.join(" ");

  return (
    <div className={containerClassNames}>
      <div>
        <p className={userNameClassNames}>
          {name} {surname}
        </p>
      </div>
      <div className={avatarClassNames}>
        {avatarUrl ? (
          <img
            className="rounded-full object-cover"
            src={avatarUrl}
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              setAvatarUrl(undefined);
            }}
          />
        ) : (
          <p className="text-xl tracking-wider">{getInitials(name, surname)}</p>
        )}
      </div>
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
  "h-14",
  "w-14",
  "bg-teal-400",
];

export default UserAvatar;

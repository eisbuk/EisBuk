import React, { useState } from "react";

import { User } from "@eisbuk/svg";

interface AvatarProps extends React.HTMLAttributes<HTMLElement> {
  photoURL?: string;
}

const Avatar: React.FC<AvatarProps> = ({ photoURL, ...props }) => {
  const [avatarUrl, setAvatarUrl] = useState(photoURL);

  // Get avatar for display
  // default: if no valid 'photoURL' fall back to the placeholder
  const displayAvatar = avatarUrl ? (
    <img
      className="h-full w-full object-cover"
      src={avatarUrl}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null;
        setAvatarUrl(undefined);
      }}
    />
  ) : (
    <div className="m-[-20%] mb-[-60%]">
      <User />
    </div>
  );

  return (
    <div className="h-10 w-10" {...props}>
      <div className="h-full w-full flex items-center justify-center rounded-full bg-teal-400 overflow-hidden">
        {displayAvatar}
      </div>
    </div>
  );
};

export default Avatar;

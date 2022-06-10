import React from "react";

import { CustomerBase } from "@eisbuk//shared";

interface UserAvatarProps extends Pick<CustomerBase, "name" | "surname"> {
  avatar?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = () => {
  return <div></div>;
};

export default UserAvatar;

import React from "react";
import { useHistory } from "react-router-dom";
import { getAuth, signOut } from "@firebase/auth";

import { Routes } from "@eisbuk/shared/ui";
import {
  AthleteAvatarMenu,
  AthleteAvatarMenuProps,
  DropdownMenu,
  UserAvatar,
} from "@eisbuk/ui";

const AthletAvatatController: React.FC<AthleteAvatarMenuProps> = ({
  ...props
}) => {
  const history = useHistory();

  return (
    <DropdownMenu
      content={
        <AthleteAvatarMenu
          {...props}
          onAthleteClick={({ secretKey }) =>
            history.push(`${Routes.CustomerArea}/${secretKey}`)
          }
          onAddAccount={() => history.push(Routes.SelfRegister)}
          onLogout={async () => {
            await signOut(getAuth());
            history.push(Routes.Login);
          }}
        />
      }
    >
      <UserAvatar {...props.currentAthlete} />
    </DropdownMenu>
  );
};

export default AthletAvatatController;

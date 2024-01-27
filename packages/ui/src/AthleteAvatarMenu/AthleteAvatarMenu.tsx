import React from "react";

import { Customer } from "@eisbuk/shared";
import { Plus, PowerCircle } from "@eisbuk/svg";
import { ActionButton, useTranslation } from "@eisbuk/translations";

import { shortName } from "../utils/helpers";

export interface AthleteAvatarMenuProps {
  currentAthlete?: Customer;
  otherAccounts?: Customer[];
  onAthleteClick?: (athlete: Customer) => void;
  onAddAccount?: () => void;
  onLogout?: () => void;
}

const getDisplayName = ({ name, surname }: Customer) =>
  shortName(name, surname).join(" ");

const AthleteAvatarMenu: React.FC<AthleteAvatarMenuProps> = ({
  currentAthlete,
  otherAccounts,
  onAthleteClick = () => {},
  onAddAccount = () => {},
  onLogout = () => {},
}) => {
  const { t } = useTranslation();

  if (!currentAthlete) return null;

  return (
    <div className="inline-block px-3 select-none bg-gray-50 py-2 rounded-sm border-gray-200 border">
      <div className="w-full pb-2">{getDisplayName(currentAthlete)}</div>

      {otherAccounts?.length ? (
        <div className="border-t pt-4 pb-2 pl-3">
          {otherAccounts.map((profile) => (
            <button
              onClick={() => onAthleteClick(profile)}
              className={itemClasses}
            >
              {getDisplayName(profile)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="border-t pt-4 pb-2 pl-3">
        <button onClick={onAddAccount} className={itemClasses}>
          <span className="align-middle inline-block h-5 w-5 mr-1">
            <Plus />
          </span>
          <span className="align-middle">{t(ActionButton.AddAthlete)}</span>
        </button>
        <button onClick={onLogout} className={itemClasses}>
          <span className="align-middle inline-block h-5 w-5 mr-1">
            <PowerCircle />
          </span>
          <span className="align-middle">{t(ActionButton.LogOut)}</span>
        </button>
      </div>
    </div>
  );
};

const itemClasses = "block whitespace-nowrap text-gray-700 hover:text-gray-900";

export default AthleteAvatarMenu;

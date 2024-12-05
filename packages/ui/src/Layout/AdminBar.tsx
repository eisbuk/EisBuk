import React from "react";
import { Link, useLocation } from "react-router-dom";

import { ActionButton, AdminAria, useTranslation } from "@eisbuk/translations";
import { PowerCircle } from "@eisbuk/svg";

import Button, { ButtonIcon } from "../Button";
import { LinkItem } from "./Layout";
import MobileHamburgerMenu from "./MobileHamburgerMenu";

interface AdminBarProps {
  adminLinks: LinkItem[];
  className?: string;
  additionalContent?: JSX.Element;
  onLogout?: () => void;
}

const AdminBar: React.FC<AdminBarProps> = ({
  adminLinks,
  className = "",
  additionalContent,
  onLogout = () => {},
}) => {
  const { pathname } = useLocation();
  const currentPath = pathname.split("?")[0].replace(/\/$/, "");

  const { t } = useTranslation();
  return (
    <div aria-label={t(AdminAria.PageNav)} className={className}>
      <MobileHamburgerMenu adminLinks={adminLinks} onLogout={onLogout} />
      <div className="overflow-hidden h-10 text-white hidden items-center border-2 rounded-lg divide-x-2 md:flex">
        {adminLinks.map(({ Icon: I, label, slug }, i) => {
          const isActive = slug === currentPath;

          return (
            <Link key={label + i} className="min-w-36 h-full" to={slug}>
              <Button
                className={[
                  "h-full rounded-none w-full",
                  isActive
                    ? "!bg-cyan-700"
                    : "text-opacity-80 hover:bg-white/5 active:bg-white/10",
                ].join(" ")}
                startAdornment={<ButtonIcon I={I} />}
                disabled={isActive}
              >
                {label}
              </Button>
            </Link>
          );
        })}
      </div>
      <div className="flex items-center">
        <div key="additional-content" className="flex align-center">
          {additionalContent}
        </div>
        <button
          onClick={onLogout}
          className="hidden pl-4 pr-2 py-0.5 items-center whitespace-nowrap rounded-lg text-white gap-x-1 md:flex hover:bg-white/10"
        >
          {t(ActionButton.LogOut)}
          <span className="h-9 w-9 block">
            <PowerCircle />
          </span>
        </button>
      </div>
    </div>
  );
};

export default AdminBar;

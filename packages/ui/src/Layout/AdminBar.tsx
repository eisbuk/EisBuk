import React from "react";
import { Link, useLocation } from "react-router-dom";

import { AdminAria, useTranslation } from "@eisbuk/translations";

import Button from "../Button";
import { LinkItem } from "./Layout";
import MobileHamburgerMenu from "./MobileHamburgerMenu";

interface AdminBarProps {
  adminLinks: LinkItem[];
  className?: string;
  additionalContent?: JSX.Element;
}

const AdminBar: React.FC<AdminBarProps> = ({
  adminLinks,
  className = "",
  additionalContent,
}) => {
  const { pathname: currentPath } = useLocation();

  const { t } = useTranslation();
  return (
    <div
      aria-label={t(AdminAria.PageNav)}
      className={[className, "md:justify-end"].join(" ")}
    >
      <MobileHamburgerMenu adminLinks={adminLinks} />
      <div className={baseClasses.join(" ")}>
        {adminLinks.map(({ Icon, label, slug }, i) => {
          const isActive = currentPath === slug;

          return (
            <Link key={label + i} className="min-w-36 h-full" to={slug}>
              <Button
                className={[
                  "h-full rounded-none",
                  isActive
                    ? "bg-cyan-700"
                    : "text-opacity-80 hover:bg-white/5 active:bg-white/10",
                ].join(" ")}
                startAdornment={<Icon />}
                disabled={isActive}
              >
                {label}
              </Button>
            </Link>
          );
        })}
      </div>
      {additionalContent}
    </div>
  );
};

const baseClasses = [
  "overflow-hidden",
  "flex",
  "h-10",
  "text-white",
  "hidden",
  "items-center",
  "border-2",
  "rounded-lg",
  "divide-x-2",
  "md:flex",
];

export default AdminBar;

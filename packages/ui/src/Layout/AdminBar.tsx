import React from "react";
import { Link } from "react-router-dom";
import Button from "../Button";
import { LinkItem } from "./Layout";
import MobileHamburgerMenu from "./MobileHamburgerMenu";

interface AdminBarProps {
  isAdmin?: boolean;
  adminLinks: LinkItem[];
  className?: string;
}

const AdminBar: React.FC<AdminBarProps> = ({
  isAdmin,
  adminLinks,
  className,
}) => {
  return (
    <div className={`${className} rounded-full`}>
      <MobileHamburgerMenu adminLinks={adminLinks} />
      <div className={baseClasses.join(" ")}>
        {isAdmin &&
          adminLinks.map(({ Icon, label, slug }) => {
            return (
              <Link to={slug}>
                <div className="w-32 border-r-2 p-1">
                  <Button startAdornment={<Icon />}>{label}</Button>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
};

const baseClasses = [
  "flex",
  "h-10",
  "text-white",
  "hidden",
  "md:flex",
  "items-center",
  "md:justify-end",
  "border-2",
  "rounded-full",
];

export default AdminBar;

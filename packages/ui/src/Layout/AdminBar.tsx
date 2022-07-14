import React from "react";
import { Link } from "react-router-dom";
import Button from "../Button";
import { LinkItem } from "./Layout";
import MobileHamburgerMenu from "./MobileHamburgerMenu";

interface AdminBarProps {
  adminLinks: LinkItem[];
  className?: string;
}

const AdminBar: React.FC<AdminBarProps> = ({ adminLinks, className = "" }) => {
  return (
    <div className={`${className} md:justify-end`}>
      <MobileHamburgerMenu adminLinks={adminLinks} />
      <div className={baseClasses.join(" ")}>
        {adminLinks.map(({ Icon, label, slug }, i) => {
          return (
            <Link to={slug}>
              <div
                className={`min-w-36 p-1 ${
                  i !== adminLinks.length - 1 ? `border-r-2` : ""
                }`}
              >
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
  "border-2",
  "rounded-lg ",
];

export default AdminBar;

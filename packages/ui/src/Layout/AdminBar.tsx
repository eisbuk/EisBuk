import React from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../Button";
import { LinkItem } from "./Layout";
import MobileHamburgerMenu from "./MobileHamburgerMenu";

interface AdminBarProps {
  adminLinks: LinkItem[];
  className?: string;
}

const AdminBar: React.FC<AdminBarProps> = ({ adminLinks, className = "" }) => {
  const location = useLocation();
  return (
    <div className={[className, "md:justify-end"].join(" ")}>
      <MobileHamburgerMenu adminLinks={adminLinks} />
      <div className={baseClasses.join(" ")}>
        {adminLinks.map(({ Icon, label, slug }, i) => (
          <Link
            key={label + i}
            className={[
              "min-w-36 p-[0.1px] hover:bg-white/5 active:bg-white/10 ",
              i === 0 ? "bg-cyan-700" : "text-opacity-80",
              slug === location.pathname ? "bg-cyan-700" : "text-opacity-80",
            ].join(" ")}
            to={slug}
          >
            <Button startAdornment={<Icon />}>{label}</Button>
          </Link>
        ))}
      </div>
    </div>
  );
};

const baseClasses = [
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

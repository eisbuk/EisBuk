import React from "react";
import { Link } from "react-router-dom";
import MobileHamburgerMenu from "./MobileHamburgerMenu";

interface Item {
  Icon: string;
  label: string;
  slug: string;
}
interface AdminBarProps {
  isAdmin?: boolean;
  adminLinks: Item[];
}

const AdminBar: React.FC<AdminBarProps> = ({ isAdmin, adminLinks }) => {
  return (
    <div>
      <MobileHamburgerMenu adminLinks={adminLinks} />
      <div className={getHeaderRowClasses()}>
        {isAdmin &&
          adminLinks.map(({ Icon, label, slug }, i) => {
            return (
              <div
                className={[
                  `flex items-center justify-center border-2`,
                  getRoundedClass(i, adminLinks.length),
                ].join(" ")}
              >
                <div className="w-12 h-8 p-2">
                  <Icon />
                </div>
                <div className="pr-4">
                  <Link to={slug}>{label}</Link>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

/** Get styles for top / botton row of the header */
const getHeaderRowClasses = () => {
  const baseClasses = [
    "translate-x-80",
    "translate-y-2",
    "flex",
    "h-10",
    "text-white",
    "hidden",
    "md:flex",
    "items-center",
  ];

  return [...baseClasses].join(" ");
};

const getRoundedClass = (index: number, length: number) => {
  switch (index) {
    case 0:
      return "rounded-full rounded-r-none";

    case length - 1:
      return "rounded-full rounded-l-none";
    default:
      return "";
  }
};

export default AdminBar;

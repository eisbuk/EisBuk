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
                <Button
                  className="w-32 flex justify-center items-center border-r-2 p-1"
                  startAdornment={<Icon />}
                >
                  {label}
                </Button>
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

// const getRoundedClass = (index: number, length: number) => {
//   switch (index) {
//     case 0:
//       return "rounded-full rounded-r-none";

//     case length - 1:
//       return "rounded-full rounded-l-none";
//     default:
//       return "";
//   }
// };

export default AdminBar;

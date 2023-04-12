import React, { useState } from "react";
import { Link } from "react-router-dom";

import { SVGComponent } from "@eisbuk/svg";

interface Item {
  Icon: SVGComponent;
  label: string;
  slug: string;
}
interface MobileHamburgerMenuProps {
  adminLinks: Item[];
}

const MobileHamburgerMenu: React.FC<MobileHamburgerMenuProps> = ({
  adminLinks,
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="flex items-center justify-between py-8 md:hidden">
      <nav>
        <section className="flex md:hidden">
          <div
            className="space-y-2"
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            <span className="block h-0.5 w-8 animate-pulse bg-gray-600"></span>
            <span className="block h-0.5 w-8 animate-pulse bg-gray-600"></span>
            <span className="block h-0.5 w-8 animate-pulse bg-gray-600"></span>
          </div>

          <div className={getMenuNavStyles(isNavOpen)}>
            <div
              className="absolute top-0 right-0 px-8 py-8"
              onClick={() => setIsNavOpen(false)}
            >
              <svg
                className="h-8 w-8 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <ul className="flex flex-col items-center justify-between min-h-[250px]">
              {adminLinks.map(({ label, slug }) => (
                <li
                  key={slug}
                  className="border-b border-gray-400 my-8 uppercase"
                >
                  <Link to={slug}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </nav>
    </div>
  );
};

/** Get styles for top / botton row of the header */
const getMenuNavStyles = (isNavOpen: boolean) => {
  const menuNav = [
    "absolute",
    "w-full",
    "h-screen",
    "bg-white",
    "top-0",
    "left-0",
    "z-10",
    "flex",
    "flex-col",
    "justify-evenly",
    "align-center",
  ];

  return isNavOpen ? [...menuNav].join(" ") : "hidden";
};

export default MobileHamburgerMenu;

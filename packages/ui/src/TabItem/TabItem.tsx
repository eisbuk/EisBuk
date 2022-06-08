import React from "react";

import type { SVGComponent } from "@eisbuk/svg";

interface TabItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  label: string;
  Icon: SVGComponent;
  active?: boolean;
}

const TabItem: React.FC<TabItemProps> = ({
  label,
  Icon,
  active = false,
  ...props
}) => {
  const buttonStateClasses = active
    ? buttonActiveClasses
    : buttonDefaultClasses;

  const svgClassNames = svgClasses.join(" ");
  const buttonClassNames = [...buttonBaseClasses, ...buttonStateClasses].join(
    " "
  );

  return (
    <button className={buttonClassNames} {...props}>
      <span className={svgClassNames}>
        <Icon />
      </span>
      <span>{label}</span>
    </button>
  );
};

const svgClasses = ["w-6", "h-6"];

const buttonBaseClasses = [
  "flex",
  "flex-col",
  "sm:flex-row",
  "items-center",
  "justify-center",
  "min-w-[6rem]",
  "sm:min-w-[8rem]",
  "py-2",
  "px-2",
  "sm:space-x-2",
  "sm:space-y-0",
  "space-y-1",
  "text-base",
  "rounded-lg",
  "select-none",
];

const buttonDefaultClasses = [
  "bg-none",
  "text-gray-200",
  "hover:text-white",
  "hover:bg-gray-700",
];

const buttonActiveClasses = ["bg-cyan-700", "text-white"];

export default TabItem;

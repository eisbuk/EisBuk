import React from "react";

interface ButtonProps {
  color?: string;
  backgroundColor?: string;
  label: string;
  icon: string;
  onClick?: () => void;
}

const AuthButton: React.FC<ButtonProps> = ({
  label,
  icon,
  backgroundColor,
  color,
  onClick,
}) => (
  <li className="mb-4 list-none">
    <button
      className={buttonClasses.join(" ")}
      onClick={onClick}
      style={{
        backgroundColor: backgroundColor || "#ffff",
        color: color || "#0000",
      }}
    >
      <span className="table-cell align-middle">
        <img className="inline w-[18px] h-[18px]" src={icon} />
      </span>
      <span
        style={{ color }}
        className="pl-4 text-sm font-semibold tracking-tight align-middle table-cell"
      >
        {label}
      </span>
    </button>
  </li>
);

const buttonClasses = [
  "block",
  "w-full",
  "max-w-[220px]",
  "min-w-16",
  "min-h-10",
  "px-4",
  "py-2",
  "text-sm",
  "font-medium",
  "text-left",
  "rounded-sm",
  "shadow-[0px_2px_2px_#00000024,0_3px_1px_-2px_#0003,0_1px_5px_#0000001f]",
];

export default AuthButton;

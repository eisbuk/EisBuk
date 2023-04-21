import React from "react";

import { SVGComponent } from "@eisbuk/svg";

interface IconAdornmentProps {
  Icon?: SVGComponent;
  position: "start" | "end";
  disabled?: boolean;
}

interface AddOnAdornmentProps {
  label: string;
}

interface ButtonAdornmentProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  Icon?: SVGComponent;
  label: string;
  disabled?: boolean;
}

export const IconAdornment: React.FC<IconAdornmentProps> = ({
  Icon = () => null,
  position,
  disabled = false,
}) => {
  const padding = position === "start" ? "pl-3" : "pr-3";
  const colour = disabled ? "text-cyan-700" : "text-gray-400";

  return (
    <div className={padding}>
      <div className={`h-5 w-5 ${colour}`} aria-hidden="true">
        <Icon />
      </div>
    </div>
  );
};

export const AddOnAdornment: React.FC<AddOnAdornmentProps> = ({ label }) => (
  <span className="h-full inline-flex items-center px-3 rounded-l-md border-r-[1px] border-gray-300 bg-gray-50 text-gray-500 text-sm">
    {label}
  </span>
);

export const ButtonAdornment: React.FC<ButtonAdornmentProps> = ({
  Icon = () => null,
  label,
  onClick = () => {},
  disabled = false,
  ...props
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type="button"
    className="h-full -ml-px inline-flex items-center space-x-2 px-4 border-l-[1px] border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-700 focus:border-cyan-700"
    {...props}
  >
    <div className="h-5 w-5 text-gray-400" aria-hidden="true">
      <Icon />
    </div>
    <span>{label}</span>
  </button>
);

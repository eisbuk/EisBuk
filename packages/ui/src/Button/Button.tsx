import React from "react";

export enum ButtonSize {
  Base = "md",
  LG = "lg",
}

export enum ButtonColor {
  Primary = "primary",
  Secondary = "secondary",
  Error = "error",
}

export interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  color?: ButtonColor;
  StartAdornment?: React.FC;
  EndAdornment?: React.FC;
  disabled?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

const Button: React.FC<ButtonProps> = ({
  size = ButtonSize.Base,
  color,
  StartAdornment,
  EndAdornment,
  children,
  className: classes,
  disabled = false,
  as = "button",
  ...props
}) => {
  const className = [
    ...baseClasses,
    ...sizeClassesLookup[size],
    getColorClass(disabled, color),
    classes,
  ].join(" ");

  return React.createElement(as, { ...props, className, disabled }, [
    StartAdornment && (
      <div key="start-adornment" className="mr-1">
        <StartAdornment />
      </div>
    ),

    children,

    EndAdornment && (
      <div key="end-adornment" className="ml-1">
        <EndAdornment />
      </div>
    ),
  ]);
};

const baseClasses = [
  "font-semibold",
  "rounded-md",
  "text-white",
  "flex",
  "justify-center",
];

const sizeClassesLookup = {
  [ButtonSize.Base]: ["px-2.5", "py-[6px]", "text-sm"],
  [ButtonSize.LG]: ["px-[17px]", "py-[9px]", "text-base"],
};

const getColorClass = (disabled: boolean, color?: ButtonColor) =>
  disabled ? "bg-gray-200" : !color ? "" : colorClassLookup[color];

const colorClassLookup = {
  [ButtonColor.Primary]: "bg-cyan-500",
  [ButtonColor.Secondary]: "bg-yellow-600",
  [ButtonColor.Error]: "bg-red-700",
};

export default Button;

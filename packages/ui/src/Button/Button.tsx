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
}

const Button: React.FC<ButtonProps> = ({
  size = ButtonSize.Base,
  color,
  StartAdornment,
  EndAdornment,
  children,
  className: classes,
  disabled = false,
  ...props
}) => {
  const className = [
    ...baseClasses,
    ...sizeClassesLookup[size],
    getColorClass(disabled, color),
    classes,
  ].join(" ");

  return (
    <button {...{ ...props, className, disabled }}>
      {StartAdornment && (
        <div className="mr-1">
          <StartAdornment />
        </div>
      )}

      {children}

      {EndAdornment && (
        <div className="ml-1">
          <EndAdornment />
        </div>
      )}
    </button>
  );
};

const baseClasses = [
  "font-semibold",
  "rounded-md",
  "text-white",
  "flex",
  "justify-center",
];

const sizeClassesLookup = {
  [ButtonSize.Base]: ["px-[10px]", "py-[6px]", "text-sm"],
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

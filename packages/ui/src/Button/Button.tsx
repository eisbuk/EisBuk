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
}

const Button: React.FC<ButtonProps> = ({
  size = ButtonSize.Base,
  color,
  StartAdornment,
  EndAdornment,
  children,
  className: classes,
  ...props
}) => {
  const className = [
    ...baseClasses,
    ...sizeClassesLookup[size],
    ...(color ? colorClassesLookup[color] : []),
    classes,
  ].join(" ");

  return (
    <button {...{ ...props, className }}>
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

const baseClasses = ["font-600", "rounded-md"];

const sizeClassesLookup = {
  [ButtonSize.Base]: ["px-[10px]", "py-[6px]", "text-sm"],
  [ButtonSize.LG]: ["px-[17px]", "py-[9px]", "text-base"],
};

const colorClassesLookup = {
  [ButtonColor.Primary]: ["bg-cyan-500"],
  [ButtonColor.Secondary]: ["bg-yellow-600"],
  [ButtonColor.Error]: ["bg-red-700"],
};

export default Button;

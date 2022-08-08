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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  color?: ButtonColor;
  startAdornment?: JSX.Element | null;
  endAdornment?: JSX.Element | null;
  disabled?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

const Button: React.FC<ButtonProps> = ({
  size = ButtonSize.Base,
  color,
  startAdornment,
  endAdornment,
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

  const content = !children ? null : typeof children === "string" ? (
    <span key="content">{children}</span>
  ) : (
    children
  );

  return React.createElement(as, { ...props, className, disabled }, [
    startAdornment && (
      <div key="start-adornment" className="h-5 shrink-0">
        {startAdornment}
      </div>
    ),

    content,

    endAdornment && (
      <div key="end-adornment" className="h-5 shrink-0">
        {endAdornment}
      </div>
    ),
  ]);
};

const baseClasses = [
  "font-semibold",
  "rounded-md",
  "text-white",
  "flex",
  "items-center",
  "gap-2.5",
  "select-none",
  "tracking-wide",
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

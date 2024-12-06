import React from "react";

export enum ButtonSize {
  Base = "base",
  MD = "md",
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
    applyWhiteTextFallback(baseClasses, classes),
    ...sizeClassesLookup[size],
    getColorClass(disabled, color),
  ].join(" ");

  const content = !children ? null : typeof children === "string" ? (
    <span key="content">{children}</span>
  ) : (
    children
  );

  return React.createElement(
    as,
    { type: "button", ...props, className, disabled },
    [
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
    ]
  );
};

const baseClasses = [
  "font-semibold",
  "rounded-md",
  "flex",
  "items-center",
  "gap-2.5",
  "select-none",
  "tracking-wide",
];

const sizeClassesLookup = {
  [ButtonSize.Base]: ["px-2.5", "py-[6px]", "text-sm"],
  [ButtonSize.MD]: ["px-4", "py-2", "text-sm"],
  [ButtonSize.LG]: ["px-[17px]", "py-[9px]", "text-base"],
};

const getColorClass = (disabled: boolean, color?: ButtonColor) =>
  disabled ? "bg-gray-200" : !color ? "" : colorClassLookup[color];

const colorClassLookup = {
  [ButtonColor.Primary]: "bg-cyan-500",
  [ButtonColor.Secondary]: "bg-yellow-600",
  [ButtonColor.Error]: "bg-red-700",
};

/**
 * Goes over the input classes (className), check if there's a text color tailwind class.
 * If not, adds a fallback 'text-white' class.
 * @param baseClasses - base classes to apply
 * @param className - input classes from component props
 * @returns combined classes
 */
const applyWhiteTextFallback = (baseClasses: string[], className = "") => {
  const classes = className.split(" ");
  const _baseClasses = [...baseClasses];

  // Write a conditional (regex) check to see if one of the 'classes' matches a pattern of a text color class.
  // Exmples: text-red-500, text-blue-600, text-gray-200, etc.
  const hasTextColorClass = classes.some((c) => /^text-[a-z]+-[0-9]+$/.test(c));
  if (!hasTextColorClass) {
    _baseClasses.push("text-white");
  }
  return [..._baseClasses, ...classes].join(" ");
};

export const ButtonIcon: React.FC<{ I: React.FC }> = ({ I }) => (
  <div className="h-5 w-5">
    <I />
  </div>
);

export default Button;

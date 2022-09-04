import React, { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

import { Button, ButtonColor, ButtonSize } from "@eisbuk/ui";

export interface ActionButtonProps
  extends Omit<
    DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    "color"
  > {
  variant: "empty" | "fill" | "text";
}

/**
 * Type of `actionButtonLookup` record.
 * A standardized type for creating lookup of buttons:
 * - indexed by `I` type param (extends string)
 * - each record entry is the array of button props, with `children` replaced by `label`
 * - button props can be extended with optional `E` param
 */
export type ActionButtonLookup<I extends string> = Partial<
  Record<
    I,
    Array<
      Omit<ActionButtonProps, "children"> & { label: string } & Record<
          string,
          any
        >
    >
  >
>;

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant,
  ...props
}) => {
  switch (variant) {
    case "text":
      return (
        <button className={textButtonClasses.join(" ")} {...props}>
          {children}
        </button>
      );

    case "fill":
      return (
        <Button
          {...props}
          size={ButtonSize.MD}
          color={ButtonColor.Primary}
          className="uppercase"
        >
          {children}
        </Button>
      );

    case "empty":
      return (
        <Button
          {...props}
          size={ButtonSize.MD}
          className="uppercase !text-cyan-600"
        >
          {children}
        </Button>
      );

    // Shouldn't happen
    default:
      return null;
  }
};

const textButtonClasses = [
  "text-cyan-600",
  "hover:underline",
  "hover:cursor-pointer",
];

export default ActionButton;

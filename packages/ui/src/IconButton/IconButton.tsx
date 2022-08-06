import React from "react";

export enum IconButtonSize {
  XS = "xs",
  MD = "md",
  LG = "lg",
}
export enum IconButtonShape {
  Square = "square",
  Round = "round",
}
export enum IconButtonContentSize {
  Tight = "tight",
  Medium = "medium",
  Relaxed = "relaxed",
}
export enum IconButtonBackground {
  Light = "light",
  Dark = "dark",
}

interface IconButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  shape?: IconButtonShape;
  contentSize?: IconButtonContentSize;
  hoverBackground?: IconButtonBackground;
  alt?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  size = IconButtonSize.MD,
  shape = IconButtonShape.Square,
  contentSize = IconButtonContentSize.Medium,
  hoverBackground = IconButtonBackground.Light,
  alt,
  children,
  className,
  ...props
}) => (
  <button
    {...props}
    title={alt}
    className={[
      sizeLookup[size],
      borderRadiusLookup[shape],
      contentSizePaddingLookup[contentSize],
      backgroundColorLookup[hoverBackground],
      className,
    ].join(" ")}
  >
    {children}
  </button>
);

const sizeLookup = {
  [IconButtonSize.XS]: "w-5 h-5",
  [IconButtonSize.MD]: "w-8 h-8",
  [IconButtonSize.LG]: "w-11 h-11",
};
const borderRadiusLookup = {
  [IconButtonShape.Square]: "rounded-md",
  [IconButtonShape.Round]: "rounded-full",
};
const contentSizePaddingLookup = {
  [IconButtonContentSize.Tight]: "p-0",
  [IconButtonContentSize.Medium]: "p-0.5",
  [IconButtonContentSize.Relaxed]: "p-2",
};
const backgroundColorLookup = {
  [IconButtonBackground.Light]: "hover:bg-white/10",
  [IconButtonBackground.Dark]: "hover:bg-black/10",
};

export default IconButton;

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
  StartAdornment,
  EndAdornment,
  children,
  ...props
}) => {
  return (
    <button {...{ ...props }}>
      {StartAdornment && <StartAdornment />}
      {children}
      {EndAdornment && <EndAdornment />}
    </button>
  );
};

export default Button;

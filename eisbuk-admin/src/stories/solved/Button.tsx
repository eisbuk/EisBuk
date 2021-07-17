import React from "react";
import { Button as Btn } from "@material-ui/core";

export type ButtonProps = {
  /**
   * Button _custom_ text
   */
  buttonText?: string;

  /**
   * Simple click handler
   */
  onClick?: () => void;

  /**
   *
   */
  color?: "default" | "primary";
};

/**
 * The world's most _basic_ button
 */
export const Button: React.FC<ButtonProps> = ({
  buttonText = "",
  onClick = () => {},
  color = "default",
}: ButtonProps) => (
  <Btn onClick={onClick} color={color} variant="contained">
    {buttonText}
  </Btn>
);

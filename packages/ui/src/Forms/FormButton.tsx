import React from "react";

import Button, { ButtonSize } from "../Button";

export enum FormButtonColor {
  Green = "bg-green-200 hover:bg-green-100",
  Cyan = "bg-cyan-200 hover:bg-cyan-100",
  Gray = "bg-gray-100 hover:bg-gray-50",
}

interface FormButtonProps {
  color: FormButtonColor;
  onClick?: () => void;
  type?: "submit" | "reset" | "button";
  disabled?: boolean;
}

const FormButton: React.FC<FormButtonProps> = ({ color, ...props }) => (
  <Button
    className={`w-24 !text-gray-700 ${color}`}
    size={ButtonSize.LG}
    {...props}
  />
);

export default FormButton;

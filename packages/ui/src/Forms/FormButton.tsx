import React from "react";

import Button, { ButtonProps, ButtonSize } from "../Button";

export enum FormButtonColor {
  Green = "bg-green-200 hover:bg-green-100",
  Cyan = "bg-cyan-200 hover:bg-cyan-100",
  Gray = "bg-gray-100 hover:bg-gray-50",
  Red = "bg-red-200 hover:bg-red-100",
}

interface FormButtonProps extends Omit<ButtonProps, "color"> {
  color: FormButtonColor;
}

const FormButton: React.FC<FormButtonProps> = ({
  color: propsColor,
  ...props
}) => {
  const color = props.disabled ? "bg-gray-50 !text-gray-300" : propsColor;

  return (
    <Button
      className={`min-w-24 !text-gray-700 whitespace-nowrap ${color}`}
      size={ButtonSize.LG}
      {...props}
    />
  );
};

export default FormButton;

import React from "react";

import Button from "../Button";
import { ButtonSize } from "../Button/Button";

export interface ActionDialogProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
}

const ActionDialog: React.FC<ActionDialogProps> = ({
  title,
  onCancel = () => {},
  onConfirm = () => {},
  confirmLabel,
  cancelLabel,
  disabled,
  children,
  className = "",
}) => {
  const buttonsToRender: JSX.Element[] = [];

  if (cancelLabel) {
    buttonsToRender.push(
      <Button
        key="cancel-button"
        className="w-full !text-gray-700 font-medium bg-gray-100 hover:bg-opacity-0 md:w-auto"
        size={ButtonSize.LG}
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
    );
  }

  if (confirmLabel) {
    buttonsToRender.push(
      <Button
        key="confirm-button"
        className="w-full !text-red-700 bg-red-200 hover:bg-red-100 md:w-auto"
        size={ButtonSize.LG}
        onClick={onConfirm}
        disabled={disabled}
      >
        {confirmLabel}
      </Button>
    );
  }

  return (
    <div
      className={[
        "flex flex-col min-w-[320px] items-start gap-y-4 p-5 rounded-md bg-white",
        className,
      ].join(" ")}
    >
      <h3 className="text-base leading-6 font-semibold text-red-700">
        {title}
      </h3>
      <div>{children}</div>
      <div className="w-full flex gap-2 flex-wrap justify-end">
        {buttonsToRender}
      </div>
    </div>
  );
};

export default ActionDialog;

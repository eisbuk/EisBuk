import React from "react";

import Button from "../Button";
import { ButtonSize } from "../Button/Button";

export interface ActionDialogProps {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ActionDialog: React.FC<ActionDialogProps> = ({
  title,
  onCancel = () => {},
  onConfirm = () => {},
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  children,
}) => (
  <div className="flex flex-col max-w-sm items-start gap-y-4 p-5 rounded-md bg-white">
    <div>
      <h3 className="text-base leading-6 font-semibold text-red-700">
        {title}
      </h3>
    </div>
    <div>{children}</div>
    <div className="flex space-x-2">
      <Button
        className="!text-gray-700 font-medium bg-gray-100 hover:bg-opacity-0"
        size={ButtonSize.LG}
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        className="!text-red-700 bg-red-200 hover:bg-red-100"
        size={ButtonSize.LG}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </div>
  </div>
);

export default ActionDialog;

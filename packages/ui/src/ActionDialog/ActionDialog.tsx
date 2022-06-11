import React from "react";

import Button from "../Button";
import { ButtonSize } from "../Button/Button";

interface ActionDialogProps {
  title: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ActionDialog: React.FC<ActionDialogProps> = ({
  title,
  open,
  setOpen,
  onConfirm = () => {},
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  children,
}) => {
  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      {!open ? null : (
        <div className="fixed z-10 inset-0 opacity-0.3 overflow-y-auto">
          <div className="absolute min-w-max top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col max-w-sm items-start space-y-4 p-6 bg-white">
              <div>
                <h3 className="text-base leading-6 font-semibold text-red-700">
                  {title}
                </h3>
              </div>
              <div>{children}</div>
              <div className="flex space-x-2">
                <Button
                  className="text-gray-700 font-medium bg-gray-100 hover:bg-opacity-0"
                  size={ButtonSize.LG}
                  onClick={handleCancel}
                >
                  {cancelLabel}
                </Button>
                <Button
                  className="text-red-700 bg-red-200 hover:bg-red-100"
                  size={ButtonSize.LG}
                  onClick={handleConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionDialog;

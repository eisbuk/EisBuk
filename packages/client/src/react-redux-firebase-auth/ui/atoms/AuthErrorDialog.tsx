import React, { useRef } from "react";

import { useTranslation, ActionButton } from "@eisbuk/translations";

import useClickOutside from "@/hooks/useClickOutside";

interface Props {
  message: string;
  open?: boolean;
  onClose?: () => void;
}

const AuthErrorDialog: React.FC<Props> = ({
  message,
  open = true,
  onClose = () => {},
}) => {
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);

  // close the dialog on outside click
  useClickOutside(containerRef, onClose);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute px-4 py-2 top-0 left-[10%] right-[10%] z-50 text-center bg-yellow-100 border border-yellow-500"
    >
      <span className="text-xs leading-6 tracking-wide align-center text-black">
        <span>{message} </span>
        <span
          className="text-blue-600 font-normal cursor-pointer hover:underline"
          onClick={onClose}
        >
          {t(ActionButton.Dismiss)}
        </span>
      </span>
    </div>
  );
};

export default AuthErrorDialog;

import React from "react";

import { Customer } from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import { SendBookingLinkMethod } from "@/enums/other";

import { getDialogPrompt } from "./utils";

type SendBookingsLinkProps = BaseModalProps &
  Customer & { method: SendBookingLinkMethod };

const SendBookingsLinkDialog: React.FC<SendBookingsLinkProps> = ({
  onClose,
  className,
  ...methodProps
}) => {
  const onConfirm = () => {
    onClose();
  };

  const { title, body } = getDialogPrompt(methodProps);

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, onConfirm, className }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.Send)}
    >
      {body}
    </ActionDialog>
  );
};

export default SendBookingsLinkDialog;

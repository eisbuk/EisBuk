import React from "react";
import { useDispatch } from "react-redux";

import { Customer } from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import { SendBookingLinkMethod } from "@/enums/other";

import { getBookingsLink, getDialogPrompt, sendBookingsLink } from "./utils";

type SendBookingsLinkProps = BaseModalProps &
  Customer & { method: SendBookingLinkMethod };

const SendBookingsLinkDialog: React.FC<SendBookingsLinkProps> = ({
  onClose,
  className,
  method,
  ...customer
}) => {
  const dispatch = useDispatch();

  const bookingsLink = getBookingsLink(customer.secretKey);

  const onConfirm = () => {
    dispatch(sendBookingsLink({ ...customer, method, bookingsLink }));
    onClose();
  };

  const { title, body, disabled } = getDialogPrompt({ ...customer, method });

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, onConfirm, className, disabled }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.Send)}
    >
      {body}
    </ActionDialog>
  );
};

export default SendBookingsLinkDialog;
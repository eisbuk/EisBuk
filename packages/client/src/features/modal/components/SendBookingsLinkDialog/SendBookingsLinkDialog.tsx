import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Customer } from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import { SendBookingLinkMethod } from "@/enums/other";

import { getBookingsLink, getDialogPrompt, sendBookingsLink } from "./utils";
import { getAboutOrganization } from "@/store/selectors/app";

type SendBookingsLinkProps = BaseModalProps &
  Customer & { method: SendBookingLinkMethod };

const SendBookingsLinkDialog: React.FC<SendBookingsLinkProps> = ({
  onClose,
  className,
  method,
  // remove 'onCloseAll' from 'customer'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCloseAll,
  ...customer
}) => {
  const dispatch = useDispatch();

  const bookingsLink = getBookingsLink(customer.secretKey);
  const { displayName } = useSelector(getAboutOrganization);

  const onConfirm = () => {
    dispatch(
      sendBookingsLink({ ...customer, method, bookingsLink, displayName })
    );
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

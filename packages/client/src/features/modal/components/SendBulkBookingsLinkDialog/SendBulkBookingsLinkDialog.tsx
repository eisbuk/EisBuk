import React from "react";

import { Customer } from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { Prompt, ActionButton } from "@eisbuk/translations";

import { ModalProps } from "../../types";

type SendBulkBookingsLinkProps = ModalProps<
  { customers: Customer[] } & {
    submitting: boolean;
    action: string;
  }
>;

const SendBulkBookingsLinkDialog: React.FC<SendBulkBookingsLinkProps> = (
  props
) => {
  const { className, customers, onUpdateSelf = () => {} } = props;

  const onConfirm = () => {
    onUpdateSelf({ ...props, submitting: true, action: "confirm" });
  };
  const onCancel = () => {
    onUpdateSelf({ ...props, submitting: true, action: "cancel" });
  };

  const checkEmails = (customers: Customer[]) => {
    const customersLength = customers.length.toString();
    return customers.some((cus) => !cus.email)
      ? {
          title: i18n.t(Prompt.NoBulkEmailTitle),
          body: i18n.t(Prompt.NoBulkEmailMessage),
          disabled: true,
        }
      : {
          title: i18n.t(Prompt.SendBulkEmailTitle),
          body: i18n.t(Prompt.SendBulkEmailMessage, {
            athletesNumber: customersLength,
          }),
          disabled: false,
        };
  };

  const { title, body, disabled } = checkEmails(customers);

  return (
    <ActionDialog
      onCancel={onCancel}
      {...{
        title,
        onConfirm,
        className,
        disabled,
      }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.Send)}
    >
      {body}
    </ActionDialog>
  );
};

export default SendBulkBookingsLinkDialog;

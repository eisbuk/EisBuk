import React from "react";

import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import { SendBookingLinkMethod } from "@/enums/other";

interface SendEmailProps {
  method: SendBookingLinkMethod.Email;
  email: string;
}
interface SendSMSProps {
  method: SendBookingLinkMethod.SMS;
  phone: string;
}
type MethodProps = SendEmailProps | SendSMSProps;

type SendBookingsLinkProps = BaseModalProps & MethodProps;

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

interface GetDialogPrompt {
  (payload: MethodProps): {
    title: string;
    body: string;
  };
}

/**
 * Gets prompt text (title and body) for dialog prompt based on passed method.
 * For type safety, it accepts `null` as `method` (and returns empty strings for `promptTitle` and `promptBody`),
 * but that should not happen in reality.
 * @param {string | null} param.method "email" or "sms"
 * @param {string} param.email (optional) customer's email
 * @param {string} param.phone (optional) customer's phone
 * @returns
 */
// eslint-disable-next-line consistent-return
const getDialogPrompt: GetDialogPrompt = (props) => {
  switch (props.method) {
    case SendBookingLinkMethod.Email:
      const { email } = props;
      return {
        title: i18n.t(Prompt.SendEmailTitle),
        body: i18n.t(Prompt.ConfirmEmail, { email }),
      };

    case SendBookingLinkMethod.SMS:
      const { phone } = props;
      return {
        title: i18n.t(Prompt.SendSMSTitle),
        body: i18n.t(Prompt.ConfirmSMS, { phone }),
      };
  }
};

export default SendBookingsLinkDialog;

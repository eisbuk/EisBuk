import { Customer } from "@eisbuk/shared";
import i18n, { Prompt } from "@eisbuk/translations";

import { SendBookingLinkMethod } from "@/enums/other";

interface GetDialogPrompt {
  (
    payload: { method: SendBookingLinkMethod } & Pick<
      Customer,
      "email" | "phone"
    >
  ): {
    title: string;
    body: string;
    disabled: boolean;
  };
}

/**
 * Gets prompt text (title and body) for dialog prompt based on passed method.
 */
// eslint-disable-next-line consistent-return
export const getDialogPrompt: GetDialogPrompt = (props) => {
  switch (props.method) {
    case SendBookingLinkMethod.Email:
      const { email } = props;
      if (!email) {
        return {
          title: i18n.t(Prompt.NoEmailTitle),
          body: i18n.t(Prompt.NoEmailMessage),
          disabled: true,
        };
      }
      return {
        title: i18n.t(Prompt.SendEmailTitle),
        body: i18n.t(Prompt.ConfirmEmail, { email }),
        disabled: false,
      };

    case SendBookingLinkMethod.SMS:
      const { phone } = props;
      if (!phone) {
        return {
          title: i18n.t(Prompt.NoPhoneTitle),
          body: i18n.t(Prompt.NoPhoneMessage),
          disabled: true,
        };
      }
      return {
        title: i18n.t(Prompt.SendSMSTitle),
        body: i18n.t(Prompt.ConfirmSMS, { phone }),
        disabled: false,
      };
  }
};

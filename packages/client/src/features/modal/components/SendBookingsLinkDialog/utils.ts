import {
  ClientMessagePayload,
  Customer,
  ClientMessageType,
  SMSMessage,
  ClientMessageMethod,
} from "@eisbuk/shared";
import { CloudFunction, Routes } from "@eisbuk/shared/ui";
import i18n, { NotificationMessage, Prompt } from "@eisbuk/translations";

import { createFunctionCaller } from "@/utils/firebase";

import { FirestoreThunk } from "@/types/store";

import { SendBookingLinkMethod } from "@/enums/other";
import { NotifVariant } from "@/enums/store";

import { enqueueNotification } from "@/features/notifications/actions";
import { getOrganization } from "@/lib/getters";

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

interface SendBookingsLink {
  (
    payload: {
      method: SendBookingLinkMethod;
      bookingsLink: string;
    } & Customer
  ): FirestoreThunk;
}

export const sendBookingsLink: SendBookingsLink =
  ({ name, method, email, surname, phone, secretKey, bookingsLink }) =>
  async (dispatch, _, { getFunctions }) => {
    try {
      if (!secretKey || !email) {
        // this should be unreachable
        // (email button should be disabled in case secret key or email are not provided)
        throw new Error();
      }

      const sms = `Ciao ${name},
      Ti inviamo un link per prenotare le tue prossime lezioni con ${getOrganization()}:
      ${bookingsLink}`;

      const emailPayload: Omit<
        ClientMessagePayload<
          ClientMessageMethod.Email,
          ClientMessageType.SendBookingsLink
        >,
        "organization"
      > = {
        name,
        surname,
        email: email!,
        type: ClientMessageType.SendBookingsLink,
        bookingsLink,
      };

      const config = {
        [SendBookingLinkMethod.Email]: {
          handler: CloudFunction.SendEmail,
          payload: emailPayload,
          successMessage: i18n.t(NotificationMessage.EmailSent),
        },
        [SendBookingLinkMethod.SMS]: {
          handler: CloudFunction.SendSMS,
          payload: { to: phone, message: sms } as SMSMessage,
          successMessage: i18n.t(NotificationMessage.SMSSent),
        },
      };

      const { handler, payload, successMessage } = config[method];

      await createFunctionCaller(getFunctions(), handler, payload)();

      dispatch(
        enqueueNotification({
          message: successMessage,
          variant: NotifVariant.Success,
        })
      );
    } catch (error) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
        })
      );
    }
  };

export const getBookingsLink = (secretKey: string) =>
  `https://${window.location.host}${Routes.CustomerArea}/${secretKey}`;

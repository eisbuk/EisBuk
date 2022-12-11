import {
  ClientEmailPayload,
  Customer,
  EmailType,
  PublicOrganizationData,
  SMSMessage,
} from "@eisbuk/shared";
import i18n, { NotificationMessage, Prompt } from "@eisbuk/translations";

import { FirestoreThunk } from "@/types/store";

import { SendBookingLinkMethod } from "@/enums/other";
import { CloudFunction } from "@/enums/functions";
import { NotifVariant } from "@/enums/store";
import { Routes } from "@/enums/routes";

import { enqueueNotification } from "@/features/notifications/actions";

import { createCloudFunctionCaller } from "@/utils/firebase";

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
    } & Customer & { displayName: PublicOrganizationData["displayName"] }
  ): FirestoreThunk;
}

export const sendBookingsLink: SendBookingsLink =
  ({
    name,
    method,
    email,
    surname,
    phone,
    secretKey,
    bookingsLink,
    displayName,
  }) =>
  async (dispatch) => {
    try {
      if (!secretKey) {
        // this should be unreachable
        // (email button should be disabled in case secret key or email are not provided)
        throw new Error();
      }

      const sms = `Ciao ${name},
      Ti inviamo un link per prenotare le tue prossime lezioni con ${displayName}:
      ${bookingsLink}`;

      const emailPayload: Omit<
        ClientEmailPayload[EmailType.SendBookingsLink],
        "organization"
      > = {
        customer: {
          name,
          surname,
          email: email || "",
          secretKey,
        },
        displayName: displayName || "",
        type: EmailType.SendBookingsLink,
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

      await createCloudFunctionCaller(handler, payload)();

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

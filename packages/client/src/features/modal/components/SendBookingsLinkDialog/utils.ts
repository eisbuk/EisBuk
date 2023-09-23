import {
  ClientMessagePayload,
  Customer,
  ClientMessageType,
  ClientMessageMethod,
} from "@eisbuk/shared";
import { CloudFunction, Routes } from "@eisbuk/shared/ui";
import i18n, { NotificationMessage, Prompt } from "@eisbuk/translations";

import { createFunctionCaller } from "@/utils/firebase";

import { FirestoreThunk } from "@/types/store";

import { NotifVariant } from "@/enums/store";

import { enqueueNotification } from "@/features/notifications/actions";

interface GetDialogPrompt {
  (
    payload: { method: ClientMessageMethod } & Pick<Customer, "email" | "phone">
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
    case ClientMessageMethod.Email:
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

    case ClientMessageMethod.SMS:
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
      method: ClientMessageMethod;
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

      const payloadBase: Omit<
        ClientMessagePayload<
          ClientMessageMethod,
          ClientMessageType.SendBookingsLink
        >,
        "organization" | "email" | "phone"
      > = {
        type: ClientMessageType.SendBookingsLink,
        name,
        surname,
        bookingsLink,
      };

      const config = {
        [ClientMessageMethod.Email]: {
          handler: CloudFunction.SendEmail,
          payload: { ...payloadBase, email } as Omit<
            ClientMessagePayload<
              ClientMessageMethod.Email,
              ClientMessageType.SendBookingsLink
            >,
            "organization"
          >,
          successMessage: i18n.t(NotificationMessage.EmailSent),
        },
        [ClientMessageMethod.SMS]: {
          handler: CloudFunction.SendSMS,
          payload: { ...payloadBase, phone } as Omit<
            ClientMessagePayload<
              ClientMessageMethod.SMS,
              ClientMessageType.SendBookingsLink
            >,
            "organization"
          >,
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

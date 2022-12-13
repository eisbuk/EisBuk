import functions from "firebase-functions";
import admin from "firebase-admin";

import {
  Collection,
  DeliveryQueue,
  ClientEmailPayload,
  EmailType,
  EmailTemplate,
} from "@eisbuk/shared";

import {
  createBookingsEmailPayload,
  fetchOrganizationEmailTemplate,
  createExtendDateEmailPayload,
  createICSFileEmailPayload,
} from "./utils";
import { __functionsZone__ } from "../constants";

import { checkUser, checkSecretKey, throwUnauth } from "../utils";

/**
 * Stores email data to `emailQueue` collection, triggering email seding logic wrapped with firestore-process-delivery.
 */
export const sendEmail = functions
  .region(__functionsZone__)
  .https.onCall(
    async (
      emailPayload: ClientEmailPayload[EmailType],
      { auth }: functions.https.CallableContext
    ) => {
      if (
        !(await checkUser(emailPayload.organization, auth)) &&
        !(
          emailPayload.type === EmailType.SendCalendarFile &&
          (await checkSecretKey({
            organization: emailPayload.organization,
            secretKey: emailPayload.customer.secretKey,
          }))
        )
      ) {
        throwUnauth();
      }

      // get email temp from org doc
      const emailTemplate = await fetchOrganizationEmailTemplate(
        emailPayload.organization,
        emailPayload.type
      );
      const interpolateEmail = <T extends EmailType>(
        emailPayload: ClientEmailPayload[T],
        emailTemplate: EmailTemplate
      ) => {
        switch (emailPayload.type) {
          case EmailType.SendCalendarFile:
            return createICSFileEmailPayload(emailPayload, emailTemplate);
          case EmailType.SendExtendedBookingLink:
            return createExtendDateEmailPayload(emailPayload, emailTemplate);
          default:
            return createBookingsEmailPayload(emailPayload, emailTemplate);
        }
      };

      const email = interpolateEmail(emailPayload, emailTemplate);

      // add email to firestore, firing data trigger
      await admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${emailPayload.organization}/${DeliveryQueue.EmailQueue}`
        )
        .doc()
        .set({
          payload: {
            ...email,
            to: emailPayload.customer.email,
          },
        });

      return {
        email,
        organization: emailPayload.organization,
        success: true,
      };
    }
  );

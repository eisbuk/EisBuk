import functions from "firebase-functions";
import admin from "firebase-admin";

import {
  Collection,
  DeliveryQueue,
  ClientEmailPayload,
  EmailType,
  OrganizationData,
} from "@eisbuk/shared";

import { interpolateEmail, validateClientEmailPayload } from "./utils";
import { __functionsZone__ } from "../constants";

import { checkUser, checkSecretKey, throwUnauth } from "../utils";

/**
 * Stores email data to `emailQueue` collection, triggering email seding logic wrapped with firestore-process-delivery.
 */
export const sendEmail = functions
  .region(__functionsZone__)
  .https.onCall(
    async (
      payload: ClientEmailPayload[EmailType],
      { auth }: functions.https.CallableContext
    ) => {
      const { organization } = payload;

      if (
        !(await checkUser(organization, auth)) &&
        !(
          payload.type === EmailType.SendCalendarFile &&
          (await checkSecretKey({
            organization: organization,
            secretKey: payload.customer.secretKey,
          }))
        )
      ) {
        throwUnauth();
      }

      // Validate the payload
      const validatedPayload = validateClientEmailPayload(payload);

      // Get the template and the organization name from organizaion preferences
      const orgDoc = await admin
        .firestore()
        .collection("organizations")
        .doc(payload.organization)
        .get();
      const {
        emailTemplates,
        displayName = organization,
        emailFrom,
      } = orgDoc.data() as OrganizationData;

      const emailTemplate = emailTemplates[payload.type];

      // Interpolate the email with the payload and the organization name
      const { subject, html } = interpolateEmail(emailTemplate, {
        organizationName: displayName,
        name: validatedPayload.customer.name,
        surname: validatedPayload.customer.surname,
        bookingsLink: validatedPayload.bookingsLink,
        bookingsMonth: validatedPayload.bookingsMonth,
        extendedBookingsDate: validatedPayload.extendedBookingsDate,
        calendarFile: validatedPayload.attachments?.filename,
      });

      // Construct an email for process delivery
      const email = {
        from: emailFrom,
        to: validatedPayload.customer.email,
        subject,
        html,
        attachments: validatedPayload.attachments
          ? [validatedPayload.attachments]
          : [],
      };

      // add email to firestore, firing data trigger
      await admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${payload.organization}/${DeliveryQueue.EmailQueue}`
        )
        .doc()
        .set({
          payload: email,
        });

      return {
        email,
        organization: payload.organization,
        success: true,
      };
    }
  );

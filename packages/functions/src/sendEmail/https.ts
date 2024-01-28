import functions from "firebase-functions";
import admin from "firebase-admin";

import {
  ClientMessagePayload,
  ClientMessageType,
  OrganizationData,
  HTTPSErrors,
  ClientMessageMethod,
} from "@eisbuk/shared";

import {
  enqueueEmailDelivery,
  interpolateEmail,
  validateClientEmailPayload,
} from "./utils";
import { __functionsZone__ } from "../constants";

import {
  checkIsAdmin,
  checkSecretKey,
  throwUnauth,
  EisbukHttpsError,
} from "../utils";

/**
 * Stores email data to `emailQueue` collection, triggering email seding logic wrapped with firestore-process-delivery.
 */
export const sendEmail = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    async (
      payload: ClientMessagePayload<ClientMessageMethod.Email>,
      { auth }: functions.https.CallableContext
    ) => {
      const { organization } = payload;

      if (
        !(await checkIsAdmin(organization, auth)) &&
        !(
          payload.type === ClientMessageType.SendCalendarFile &&
          (await checkSecretKey({
            organization: organization,
            secretKey: payload.secretKey,
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
        smtpConfigured,
        emailFrom,
        emailNameFrom,
        emailBcc,
      } = orgDoc.data() as OrganizationData;

      // Check the required configuration for email sending is there
      if (!smtpConfigured) {
        throw new EisbukHttpsError("not-found", HTTPSErrors.NoSMTPConfigured);
      }
      if (!emailFrom) {
        throw new EisbukHttpsError("not-found", HTTPSErrors.NoEmailConfigured);
      }

      // Interpolate the email with the payload and the organization name
      const emailTemplate = emailTemplates[payload.type];
      const { subject, html } = interpolateEmail(emailTemplate, {
        organizationName: displayName,
        name: validatedPayload.name,
        surname: validatedPayload.surname,
        bookingsLink: validatedPayload.bookingsLink,
        bookingsMonth: validatedPayload.bookingsMonth,
        extendedBookingsDate: validatedPayload.extendedBookingsDate,
        calendarFile: validatedPayload.attachments?.filename,
      });

      // If the 'emailNameFrom' is set, we're wrapping the emailFrom to the mailbox format
      const from = emailNameFrom
        ? `${emailNameFrom} <${emailFrom}>`
        : emailFrom;

      // Construct an email for process delivery
      const email = {
        from,
        to: validatedPayload.email,
        bcc: emailBcc || emailFrom,
        subject,
        html,
        attachments: validatedPayload.attachments
          ? [validatedPayload.attachments]
          : [],
      };

      // add email to firestore, firing data trigger
      return enqueueEmailDelivery(organization, email);
    }
  );

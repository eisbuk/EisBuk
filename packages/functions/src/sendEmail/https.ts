import functions from "firebase-functions";
import admin from "firebase-admin";

import {
  Collection,
  DeliveryQueue,
  ClientEmailPayload,
  EmailType,
  OrganizationData,
  HTTPSErrors,
} from "@eisbuk/shared";

import { interpolateEmail, validateClientEmailPayload } from "./utils";
import { __functionsZone__ } from "../constants";

import {
  checkUser,
  checkSecretKey,
  throwUnauth,
  EisbukHttpsError,
} from "../utils";

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
        smtpConfigured,
        emailFrom,
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
        bcc: emailBcc || emailFrom,
        subject,
        html,
        attachments: validatedPayload.attachments
          ? [validatedPayload.attachments]
          : [],
      };

      // add email to firestore, firing data trigger
      const deliveryDoc = admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${payload.organization}/${DeliveryQueue.EmailQueue}`
        )
        .doc();

      await deliveryDoc.set({
        payload: email,
      });

      // As part of the response we're returning the delivery document path.
      // This is mostly used for testing as we might want to wait for the delivery to be marked
      // successful before making further assertions
      return {
        deliveryDocumentPath: deliveryDoc.path,
        email,
        organization,
        success: true,
      };
    }
  );

import functions from "firebase-functions";
import admin from "firebase-admin";

import {
  SendEmailPayload,
  Collection,
  DeliveryQueue,
  interpolateEmailTemplate,
} from "@eisbuk/shared";

import { fetchOrganizationEmailTemplate } from "./utils";
import { __functionsZone__ } from "../constants";

import {
  checkUser,
  checkRequiredFields,
  checkSecretKey,
  throwUnauth,
} from "../utils";

/**
 * Stores email data to `emailQueue` collection, triggering email seding logic wrapped with firestore-process-delivery.
 */
export const sendEmail = functions
  .region(__functionsZone__)
  .https.onCall(
    async (
      { organization, secretKey = "", ...email }: SendEmailPayload,
      { auth }
    ) => {
      if (
        !(await checkUser(organization, auth)) &&
        !(await checkSecretKey({ organization, secretKey }))
      ) {
        throwUnauth();
      }

      checkRequiredFields(email, [
        "to",
        "htmlRequiredFields",
        "subjectRequiredFields",
        "emailTemplateName",
      ]);

      // get email temp from org doc
      const emailTemplate = await fetchOrganizationEmailTemplate(
        organization,
        email.emailTemplateName
      );

      checkRequiredFields(
        email.htmlRequiredFields,
        emailTemplate.htmlRequiredFields
      );
      checkRequiredFields(
        email.subjectRequiredFields,
        emailTemplate.subjectRequiredFields
      );

      const interpolatedSubject = interpolateEmailTemplate(
        emailTemplate.subject,
        email.subjectRequiredFields
      );
      const interpolatedHtml = interpolateEmailTemplate(
        emailTemplate.html,
        email.htmlRequiredFields
      );

      // add email to firestore, firing data trigger
      await admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.EmailQueue}`
        )
        .doc()
        .set({
          payload: {
            ...email,
            html: interpolatedHtml,
            subject: interpolatedSubject,
          },
        });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        htmlRequiredFields,
        subjectRequiredFields,
        emailTemplateName,
        ...newEmail
      } = email;
      return {
        email: {
          ...newEmail,
          html: interpolatedHtml,
          subject: interpolatedSubject,
        },
        organization,
        success: true,
      };
    }
  );

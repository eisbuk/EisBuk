import functions from "firebase-functions";
import admin from "firebase-admin";

import {
  SendEmailPayload,
  Collection,
  DeliveryQueue,
  OrganizationData,
} from "@eisbuk/shared";

import { __functionsZone__ } from "../constants";
import { getSMTPPreferences } from "./deliver";

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
      await getSMTPPreferences(organization);

      checkRequiredFields(email, ["to", "html", "subject"]);

      // Get email preferences from organization info
      const db = admin.firestore();
      const orgSnap = await db
        .doc(`${Collection.Organizations}/${organization}`)
        .get();
      const orgData = orgSnap.data() as OrganizationData;

      // add email to firestore, firing data trigger
      const doc = admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.EmailQueue}`
        )
        .doc();

      checkRequiredFields(orgData, ["emailFrom"]);
      const { emailFrom, emailBcc } = orgData;
      await doc.set({
        payload: {
          ...email,
          from: emailFrom,
          bcc: emailBcc || emailFrom,
        },
      });

      // As part of the response we're returning the delivery document path.
      // This is mostly used for testing as we might want to wait for the delivery to be marked
      // successful before making further assertions
      return {
        deliveryDocumentPath: doc.path,
        email,
        organization,
        success: true,
      };
    }
  );

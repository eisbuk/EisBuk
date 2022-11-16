import functions from "firebase-functions";
import admin from "firebase-admin";

import {
  SendEmailPayload,
  Collection,
  DeliveryQueue,
  OrganizationData,
} from "@eisbuk/shared";

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

      checkRequiredFields(email, ["to", "html", "subject"]);

      // Get email preferences from organization info
      const db = admin.firestore();
      const orgSnap = await db
        .doc(`${Collection.Organizations}/${organization}`)
        .get();
      const { emailFrom, bcc } = orgSnap.data() as OrganizationData;

      // add email to firestore, firing data trigger
      await admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.EmailQueue}`
        )
        .doc()
        .set({ payload: { ...email, from: emailFrom, bcc } });

      return { email, organization, success: true };
    }
  );

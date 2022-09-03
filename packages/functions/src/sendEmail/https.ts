import functions from "firebase-functions";
import admin from "firebase-admin";

import { SendEmailPayload, Collection, DeliveryQueue } from "@eisbuk/shared";

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

      // add email to firestore, firing data trigger
      await admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.EmailQueue}`
        )
        .doc()
        .set({ payload: email });

      return { email, organization, success: true };
    }
  );

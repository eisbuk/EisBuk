import functions from "firebase-functions";
import admin from "firebase-admin";

import { SendMailPayload, Collection, DeliveryQueue } from "@eisbuk/shared";

import { __functionsZone__ } from "../constants";

import { checkUser, checkRequiredFields } from "../utils";

/**
 * Stores email data to `emailQueue` collection, triggering firestore-send-email extension.
 */
export const sendEmail = functions
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization, ...payload }: SendMailPayload, { auth }) => {
      await checkUser(organization, auth);

      checkRequiredFields(payload, ["to", "subject", "html"]);

      // add email to firestore, firing data trigger
      await admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.EmailQueue}`
        )
        .doc()
        .set({ payload });

      return { email: payload, organization, success: true };
    }
  );

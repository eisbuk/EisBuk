import functions from "firebase-functions";
import admin from "firebase-admin";

import { SendSMSPayload, Collection, DeliveryQueue } from "@eisbuk/shared";

import { __functionsZone__ } from "src/constants";

import { checkUser, checkRequiredFields, throwUnauth } from "../utils";

/**
 * Sends SMS message using template data from organizations firestore entry and provided params
 */
export const sendSMS = functions
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization, ...payload }: SendSMSPayload, { auth }) => {
      if (!(await checkUser(organization, auth))) throwUnauth();

      // check payload
      checkRequiredFields(payload, ["message", "to"]);

      // Add SMS to delivery queue, thus starting the delivery process
      await admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.SMSQueue}`
        )
        .doc()
        .set({ payload });

      return { sms: payload, organization, success: true };
    }
  );

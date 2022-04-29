import functions from "firebase-functions";
import admin from "firebase-admin";
import pRetry from "p-retry";

import {
  OrganizationData,
  OrganizationSecrets,
  Collection,
  DeliveryQueue,
  SMSMessage,
} from "@eisbuk/shared";
import processDelivery, {
  ProcessDocument,
} from "@eisbuk/firestore-process-delivery";

import { __smsUrl__, __functionsZone__ } from "../constants";

import { runWithTimeout, sendRequest, validateJSON } from "../utils";
import { SendSMSObjectSchema } from "./validations";

import { CheckSMSRes, SMSResponse } from "./types";

import { createSMSReqOptions } from "./utils";

/**
 * Check the state of sent sms with the provider
 * @param smsId
 * @param authToken
 * @returns
 */
const checkSMS = async (
  smsId: string,
  authToken: string
): Promise<[boolean, string, string | null]> => {
  const { proto, ...options } = createSMSReqOptions(
    "GET",
    `https://gatewayapi.com/rest/mtsms/${smsId}`,
    authToken
  );

  // ok sms states (from GatewayAPI), if we get any of these, the sending was success
  const okStates = ["DELIVERED", "ACCEPTED"];
  // we're using this function to retry until sms in one of the final states (pass or fail)
  const finalStates = [...okStates, "SKIPPED", "EXPIRED", "REJECTED"];

  const { recipients } = await sendRequest<CheckSMSRes>(proto, {
    ...options,
  });

  const { dsnstatus: status, dsnerror: errorMessage } = recipients[0];

  if (!finalStates.includes(status)) {
    throw new Error("unexpected SMS delivery status");
  }

  const smsOk = okStates.includes(status);

  return [smsOk, status, errorMessage];
};

export const deliverSMS = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.DeliveryQueues}/{organization}/${DeliveryQueue.SMSQueue}/{sms}`
  )
  .onWrite((change, { params }) =>
    processDelivery(change, async () => {
      const { organization } = params as { organization: string };

      // Get current SMS payload
      const {
        payload: { message, to },
      } = change.after.data() as ProcessDocument<SMSMessage>;

      const db = admin.firestore();

      // Get sms preferences and secrets
      const [orgSnap, secretsSnap] = await Promise.all([
        db.doc(`${Collection.Organizations}/${organization}`).get(),
        db.doc(`${Collection.Secrets}/${organization}`).get(),
      ]);

      const orgData = orgSnap.data() as OrganizationData;
      const smsFrom = orgData.smsFrom || organization.substring(0, 11);

      const secretsData = secretsSnap.data() as OrganizationSecrets;
      const authToken = secretsData.smsAuthToken || "";

      // Construct request options
      const { proto, ...options } = createSMSReqOptions(
        "POST",
        __smsUrl__,
        authToken
      );

      // Construct and validate SMS data
      const sms = validateJSON(SendSMSObjectSchema, {
        message,
        smsFrom,
        recipients: [{ msisdn: to }],
      });

      // Send SMS request to the provider
      // Success means the request was received, we're checking later for the delivery state
      const res = await sendRequest<SMSResponse>(proto, options, sms);

      if (res && res.ids) {
        // A response containg a `res` key is successful
        functions.logger.log("SMS POST request successful", { response: res });
      } else {
        // If res unsuccessful, throw
        throw new Error("Error while sending SMS request to the provider");
      }

      const smsId = res.ids[0];

      const [smsOk, , errorMessage] = await runWithTimeout(
        () => pRetry(() => checkSMS(smsId, authToken), { maxRetryTime: 10000 }),
        { timeout: 6000 }
      );

      // const details = { status, errorMessage };

      if (!smsOk) {
        throw new Error(errorMessage || "Unkonwn error has occurred");
      }

      return res;
    })
  );

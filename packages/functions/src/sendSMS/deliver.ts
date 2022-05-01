import functions from "firebase-functions";
import admin from "firebase-admin";
import { JSONSchemaType } from "ajv";

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

import { SMSResponse, SendSMSObject } from "./types";

import { createSMSReqOptions } from "./utils";
import { sendRequest, validateJSON } from "../utils";

const SMSSchema: JSONSchemaType<SendSMSObject> = {
  properties: {
    message: { type: "string" },
    smsFrom: {
      type: "string",
      maxLength: 11,
      errorMessage:
        // eslint-disable-next-line no-template-curly-in-string
        "should be a string with max 11 characters, received: ${/smsFrom}",
    },
    recipients: {
      type: "array",
      items: {
        type: "object",
        properties: { msisdn: { type: "string" } },
        required: ["msisdn"],
      },
      maxItems: 1,
    },
  },
  type: "object",
  required: ["message", "smsFrom", "recipients"],
};

/**
 * An SMS delivery functionality, uses a firestore document with path:
 *
 * `deliveryQueue/{ organization }/SMSQueue/{ sms }`
 *
 * The document is used as a data trigger to start the delivery as well as a process
 * document to log the delivery state to.
 * Under the hood uses the `processDelivery` from `@eisbuk/firestore-process-delivery`
 * to attempt delivery, retry and log delivery state accordingly.
 *
 * Additionally, the SMS request (using GatewayAPI) is sent out with a `callback_url`
 * sending the SMS delivery status to `updateSMSStatus` cloud function.
 */
export const deliverSMS = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.DeliveryQueues}/{organization}/${DeliveryQueue.SMSQueue}/{sms}`
  )
  .onWrite((change, { params }) =>
    processDelivery(change, async ({ success, error }) => {
      const { organization } = params as { organization: string };

      // Get current SMS payload
      const {
        payload: { message, to },
      } = change.after.data() as ProcessDocument<SMSMessage>;

      const db = admin.firestore();

      // Get SMS preferences and secrets
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
      const sms = validateJSON(SMSSchema, {
        message,
        smsFrom,
        recipients: [{ msisdn: to }],
      });

      // Send SMS request to the provider
      // Success means the request was received, we're checking later for the delivery state
      const res = await sendRequest<SMSResponse>(proto, options, sms);

      if (res && res.ids) {
        // A response containing a `res` key is successful
        functions.logger.log("SMS POST request successful", { response: res });
        return success(res);
      } else {
        functions.logger.log("Error while sending SMS, check the response", {
          response: res,
        });
        return error([
          "Error occurred while trying to send SMS, check the function logs for more info.",
        ]);
      }

      // const smsId = res.ids[0];

      // const [smsOk, , errorMessage] = await runWithTimeout(
      //   () => pRetry(() => checkSMS(smsId, authToken), { maxRetryTime: 10000 }),
      //   { timeout: 6000 }
      // );

      // const details = { status, errorMessage };

      // if (!smsOk) {
      //   throw new Error(errorMessage || "Unkonwn error has occurred");
      // }
    })
  );

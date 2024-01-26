import functions from "firebase-functions";
import admin from "firebase-admin";

import {
  OrganizationData,
  OrganizationSecrets,
  Collection,
  DeliveryQueue,
  SMSMessage,
  HTTPSErrors,
} from "@eisbuk/shared";
import { wrapFirestoreOnWriteHandler } from "../sentry-serverless-firebase";
import processDelivery, {
  ProcessDocument,
} from "@eisbuk/firestore-process-delivery";

import { __smsUrl__, __functionsZone__ } from "../constants";

import { SMSResponse } from "./types";

import { createSMSReqOptions, getSMSCallbackUrl } from "./utils";
import { sendRequest, validateJSON } from "../utils";
import { SMSAPIPayloadSchema } from "./validations";
import { skippedDataTrigger } from "../fallbacks";

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
  .onWrite(
    wrapFirestoreOnWriteHandler("deliverSMS", (change, { params }) =>
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
        if (!secretsData) {
          throw new Error(HTTPSErrors.NoSecrets);
        }
        const authToken = secretsData.smsAuthToken || "";

        // Construct request options
        const { proto, ...options } = createSMSReqOptions(
          "POST",
          __smsUrl__,
          authToken
        );

        // Construct and validate SMS data
        const [sms, errs] = validateJSON(SMSAPIPayloadSchema, {
          message,
          sender: smsFrom,
          recipients: [{ msisdn: to }],
          callback_url: getSMSCallbackUrl(),
        });
        if (errs) {
          return error(errs);
        }

        // Send SMS request to the provider
        // Success means the request was received, we're checking later for the delivery state
        const res = await sendRequest<SMSResponse>(proto, options, sms);

        if (res && res.ids) {
          // A response containing a `res` key is successful
          functions.logger.log("SMS POST request successful", {
            response: res,
          });
          return success(res, { status: "BUFFERED" });
        } else {
          functions.logger.log("Error while sending SMS, check the response", {
            response: res,
          });
          return error([
            "Error occurred while trying to send SMS, check the function logs for more info.",
          ]);
        }
      })
    )
  );

export const deliverSMSTesting = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.DeliveryQueues}/{organization}/${DeliveryQueue.EmailQueue}/{emailDoc}`
  )
  .onWrite(skippedDataTrigger("deliverEmailTesting", (data) => data?.payload));

import functions from "firebase-functions";
import admin from "firebase-admin";
import pRetry from "p-retry";
import http from "http";

import {
  SendSMSPayload,
  OrganizationData,
  OrganizationSecrets,
  Collection,
  DeliveryQueue,
  SMSMessage,
} from "@eisbuk/shared";
import processDelivery, {
  ProcessDocument,
} from "@eisbuk/firestore-process-delivery";

import { __smsUrl__, __functionsZone__ } from "./constants";

import {
  checkUser,
  runWithTimeout,
  sendRequest,
  checkRequiredFields,
  validateJSON,
  throwUnauth,
} from "./utils";
import { SendSMSObjectSchema } from "./validations";

// #region httpsEndpoint
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
// #endregion httpsEndpoint

// #region delivery

interface CheckSMSRes {
  recipients: {
    dsnstatus: string;
    dsnerror: string;
  }[];
}

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

interface SMSResponse {
  ids?: string[];
  usage?: {
    currency: string;
    // eslint-disable-next-line camelcase
    total_cost: number;
    countries: Record<string, unknown>;
  };
}

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

// #endregion delivery

// #region utils
/**
 * A convenience method used to create SMS request options.
 * Used purely for code readability
 * @param url
 * @param token
 * @returns
 */
const createSMSReqOptions = (
  method: "GET" | "POST",
  url: string,
  token: string
): http.RequestOptions & { proto: "http" | "https" } => {
  let proto: "http" | "https" = "https";
  let hostname = "";
  let endpoint = "/";
  let portString = "";

  // check for protocol in url string (the fallback is https)
  if (/^https?:\/\//.test(url)) {
    [proto, hostname] = url.split("://") as ["http" | "https", string];
  } else {
    hostname = url;
  }

  // split hostname and endpoint from url
  const breakingPoint = hostname.indexOf("/");
  if (breakingPoint !== -1) {
    endpoint = hostname.slice(breakingPoint);
    hostname = hostname.slice(0, breakingPoint);
  }

  // check for port number
  if (hostname.includes(":")) {
    [hostname, portString] = hostname.split(":");
  }

  const port = Number(portString) || undefined;

  return {
    proto,
    hostname,
    path: [endpoint, `token=${token}`].join("?"),
    port,
    // a standard part of each SMS post request we're sending
    headers: { ["Content-Type"]: "application/json" },
    method,
  };
};
// #endregion utils

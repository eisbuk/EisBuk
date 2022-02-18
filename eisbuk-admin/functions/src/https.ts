import * as functions from "firebase-functions";
import admin from "firebase-admin";
import pRetry from "p-retry";

import {
  Collection,
  SendMailPayload,
  SendSMSPayload,
  SendSMSErrors,
  OrganizationData,
  OrganizationSecrets,
} from "eisbuk-shared";

import { __smsUrl__, __functionsZone__ } from "./constants";

import {
  checkUser,
  createSMSReqOptions,
  sendRequest,
  EisbukHttpsError,
  runWithTimeout,
  checkRequiredFields,
} from "./utils";

/**
 * Stores email data to `emailQueue` collection, triggering firestore-send-email extension.
 */
export const sendEmail = functions
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization, ...email }: SendMailPayload, { auth }) => {
      await checkUser(organization, auth);

      checkRequiredFields(email, ["to", "subject", "html"]);

      // add email to firestore, firing data trigger
      await admin
        .firestore()
        .collection(Collection.EmailQueue)
        .doc()
        .set(email);

      return { ...email, organization, success: true };
    }
  );

/**
 * Sends SMS message using template data from organizations firestore entry and provided params
 */
export const sendSMS = functions
  .region(__functionsZone__)
  .https.onCall(async ({ organization, ...sms }: SendSMSPayload, { auth }) => {
    await checkUser(organization, auth);

    // check payload
    checkRequiredFields(sms, ["message", "to"]);
    const { message, to } = sms;

    // get SMS template data
    const orgData =
      ((
        await admin
          .firestore()
          .collection(Collection.Organizations)
          .doc(organization)
          .get()
      ).data() as OrganizationData) || {};

    // if sender not provided, fall back to organization name
    const sender = (orgData.smsSender || organization)
      .toString()
      // Non numeric senders must be 11 chars or less
      .substring(0, 11);
    functions.logger.log(`Got smsSender: ${sender}, smsUrl: ${__smsUrl__}`);

    // get sms secrets
    const { smsAuthToken: authToken } =
      (
        await admin
          .firestore()
          .collection(Collection.Secrets)
          .doc(organization)
          .get()
      ).data() || ({} as OrganizationSecrets);

    const { proto, ...options } = createSMSReqOptions(
      "POST",
      __smsUrl__,
      authToken
    );

    const data = {
      message,
      sender,
      recipients: [{ msisdn: to }],
    };
    functions.logger.log("Sending POST data:", data);

    const res = await sendRequest<SMSResponse>(proto, options, data);

    if (res && res.ids) {
      // A response containg a `res` key is successful
      functions.logger.log("SMS POST request successful", { response: res });
    } else {
      // if res unsuccessful, throw
      throw new EisbukHttpsError("cancelled", SendSMSErrors.SendingFailed, res);
    }

    const smsId = res.ids[0];

    const [smsOk, status, errorMessage] = await runWithTimeout(
      () => pRetry(() => checkSMS(smsId, authToken), { maxRetryTime: 10000 }),
      { timeout: 6000 }
    );

    const details = { status, errorMessage };

    if (!smsOk) {
      throw new EisbukHttpsError(
        "cancelled",
        SendSMSErrors.SendingFailed,
        details
      );
    }

    functions.logger.log("SMS message successfully sent, details:", details);
    return { success: true, details };
  });

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
    throw new Error();
  }

  const smsOk = okStates.includes(status);

  return [smsOk, status, errorMessage];
};

// #region types
interface SMSResponse {
  ids?: string[];
  usage?: {
    currency: string;
    // eslint-disable-next-line camelcase
    total_cost: number;
    countries: Record<string, unknown>;
  };
}

interface CheckSMSRes {
  recipients: {
    dsnstatus: string;
    dsnerror: string;
  }[];
}
// #endregion types

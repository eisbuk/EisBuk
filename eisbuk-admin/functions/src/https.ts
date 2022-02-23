import * as functions from "firebase-functions";
import admin from "firebase-admin";
import pRetry from "p-retry";

import {
  Collection,
  SendMailPayload,
  SendSMSPayload,
  HTTPErrors,
  SendEmailErrors,
  SendSMSErrors,
  OrganizationData,
  OrganizationSecrets,
} from "eisbuk-shared";

import { checkUser, createSMSReqOptions, sendRequest } from "./utils";

/**
 * Stores email data to `emailQueue` collection, triggering firestore-send-email extension.
 */
export const sendEmail = functions
  .region("europe-west6")
  .https.onCall(async (payload: Partial<SendMailPayload>, { auth }) => {
    // check payload
    if (!payload) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        HTTPErrors.NoPayload
      );
    }

    const { organization, ...email } = payload;

    await checkUser(organization, auth);

    // check payload
    if (!email.to) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendEmailErrors.NoRecipient
      );
    }
    if (!email.message?.html) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendEmailErrors.NoMsgBody
      );
    }
    if (!email.message?.subject) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendEmailErrors.NoSubject
      );
    }

    // add email to firestore, firing data trigger
    await admin.firestore().collection(Collection.EmailQueue).doc().set(email);

    return { ...payload, success: true };
  });

/**
 * Sends SMS message using template data from organizations firestore entry and provided params
 */
export const sendSMS = functions
  .region("europe-west6")
  .https.onCall(
    async ({ organization, to, message }: SendSMSPayload, { auth }) => {
      await checkUser(organization, auth);

      // get SMS template data
      const orgData =
        ((
          await admin
            .firestore()
            .collection(Collection.Organizations)
            .doc(organization!)
            .get()
        ).data() as OrganizationData) || {};

      const smsUrl = orgData.smsUrl!;
      // Non numeric senders must be 11 chars or less
      const smsFrom = (orgData.smsFrom || organization!)
        .toString()
        .substring(0, 11);
      functions.logger.log(`Got smsFrom: ${smsFrom}, smsUrl: ${smsUrl}`);

      // get sms secrets
      const { smsAuthToken: authToken } =
        (
          await admin
            .firestore()
            .collection(Collection.Secrets)
            .doc(organization!)
            .get()
        ).data() || ({} as OrganizationSecrets);

      const { proto, ...options } = createSMSReqOptions(
        "POST",
        smsUrl,
        authToken
      );

      const data = {
        message,
        // if sender not provided, fall back to organization name
        sender: smsFrom,
        recipients: [{ msisdn: to }],
      };
      functions.logger.log("Sending POST data:", data);

      const res = await sendRequest<SMSResponse>(proto, options, data);

      if (res && res.ids) {
        // A response containg a `res` key is successful
        functions.logger.log("SMS POST request successfull", { response: res });
      } else {
        functions.logger.error("Error with SMS POST", { response: res });
        // if res unsuccessful, throw
        throw new functions.https.HttpsError(
          "cancelled",
          SendSMSErrors.SendingFailed,
          res
        );
      }

      const smsId = res.ids[0];

      const [smsOk, status, errorMessage] = await runWithTimeout(
        () => pRetry(() => checkSMS(smsId, authToken), { maxRetryTime: 5000 }),
        { timeout: 6000 }
      );

      const details = { status, errorMessage };

      if (!smsOk) {
        functions.logger.error(SendSMSErrors.SendingFailed, "Details: ", {
          details,
        });
        throw new functions.https.HttpsError(
          "cancelled",
          SendSMSErrors.SendingFailed,
          details
        );
      }

      functions.logger.log("SMS message successfully sent, details:", details);
      return { success: true, details };
    }
  );

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

/**
 * A function wrapper used to enforce a timeout on async
 * operations with possibly long exectution period
 * @param fn an async function we want to execute within timeout boundary
 * @returns `fn`'s resolved value
 */
const runWithTimeout = async <T extends any>(
  fn: () => Promise<T>,
  { timeout } = { timeout: 5000 }
): Promise<T> => {
  // set a timeout boundry for a function
  const timeoutBoundary = setTimeout(() => {
    throw new functions.https.HttpsError("aborted", HTTPErrors.TimedOut);
  }, timeout);

  const res = await fn();

  // clear timeout function (the `fn` has resolved within the timeout boundry)
  clearTimeout(timeoutBoundary);

  return res;
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

import https from "https";
import http from "http";
import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { StringDecoder } from "string_decoder";

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

import { checkUser, createSMSReqOptions } from "./utils";

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

type Protocol = "https" | "http";

/**
 * Sends SMS message using template data from organizations firestore entry and provided params
 */
export const sendSMS = functions
  .region("europe-west6")
  .https.onCall(async (payload: Partial<SendSMSPayload>, { auth }) => {
    // check payload
    if (!payload) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        HTTPErrors.NoPayload
      );
    }

    const { organization, to, message } = payload;

    await checkUser(organization, auth);

    // check payload validity
    if (!to) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendSMSErrors.NoRecipient
      );
    }
    if (!message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendSMSErrors.NoMsgBody
      );
    }

    // get SMS template data
    const { smsSender: templateSender, smsUrl } =
      ((
        await admin
          .firestore()
          .collection(Collection.Organizations)
          .doc(organization!)
          .get()
      ).data() as OrganizationData) || {};

    // check template
    if (!smsUrl) {
      throw new functions.https.HttpsError(
        "not-found",
        SendSMSErrors.NoProviderURL
      );
    }

    // get sms secrets
    const { smsAuthToken: authToken } =
      (
        await admin
          .firestore()
          .collection(Collection.Secrets)
          .doc(organization!)
          .get()
      ).data() || ({} as OrganizationSecrets);

    if (!authToken) {
      throw new functions.https.HttpsError(
        "not-found",
        SendSMSErrors.NoAuthToken
      );
    }

    const { proto, ...options } = createSMSReqOptions(smsUrl, authToken);

    const data = new TextEncoder().encode(
      JSON.stringify({
        message,
        // if sender not provided, fall back to organization name
        sender: templateSender || organization!,
        recipients: [{ msisdn: to }],
      })
    );
    functions.logger.log("Sending POST data:", data);

    const res = await postSMS(proto, options, data);

    if ("ids" in res) {
      // A response containg a `res` key is successful
      functions.logger.log("SMS POST request successfull, response:", res);
    } else {
      functions.logger.error("Error with SMS POST, response is:", res);
    }

    return { success: true, res };
  });

/**
 * A helper function transforming callback structure of request into promise
 * @param {"http" | "https"} proto request protocol: "http" should be used only for testing
 * @param {RequestOptions} options request options
 * @param {Uint8Array} data serialized request body
 * @returns
 */
const postSMS = (
  proto: Protocol,
  options: https.RequestOptions,
  data: Uint8Array
) =>
  new Promise((resolve, reject) => {
    // request handler will be the same regardless of protocol used ("http"/"https")
    const handleReq = (res: http.IncomingMessage) => {
      const decoder = new StringDecoder("utf-8");
      let resBody = "";

      // reject on error (and let the caller handle further)
      res.on("error", (err) => {
        reject(err);
      });

      res.on("data", (d) => {
        resBody += decoder.write(d);
      });

      // resolve promise on successful request
      res.on("end", () => {
        resBody += decoder.end();
        const resJSON = JSON.parse(resBody);
        resolve(resJSON);
      });
    };

    // create a request using provided protocol
    const req =
      proto === "http"
        ? http.request(options, handleReq)
        : https.request(options, handleReq);

    // send request with provided data
    req.write(data);
    req.end();
  });

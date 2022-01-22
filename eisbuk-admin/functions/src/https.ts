import https from "https";
import * as functions from "firebase-functions";
import admin from "firebase-admin";

import {
  Collection,
  SendMailPayload,
  SendSMSPayload,
  HTTPErrors,
  SendEmailErrors,
  SendSMSErrors,
  OrganizationData,
} from "eisbuk-shared";

import { checkUser } from "./utils";
import { StringDecoder } from "string_decoder";

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
        SendEmailErrors.NoRecipient
      );
    }
    if (!message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendEmailErrors.NoMsgBody
      );
    }

    // get SMS template data
    const orgSnapshot = await admin
      .firestore()
      .collection(Collection.Organizations)
      .doc(organization!)
      .get();

    const { sender: templateSender, smsConfig } =
      orgSnapshot.data() as OrganizationData;

    // check template
    if (!smsConfig?.url) {
      throw new functions.https.HttpsError(
        "not-found",
        SendSMSErrors.NoProviderURL
      );
    }
    if (!smsConfig?.authToken) {
      throw new functions.https.HttpsError(
        "not-found",
        SendSMSErrors.NoAuthToken
      );
    }

    const options = createSMSReqOptions(smsConfig.url, smsConfig.authToken);

    const data = new TextEncoder().encode(
      JSON.stringify({
        message,
        // if sender not provided, fall back to organization name
        sender: templateSender || organization!,
        recipients: [{ msisdn: to }],
      })
    );

    const res = await postSMS(options, data);

    return { success: true, res };
  });

/**
 * A convenience method used to create SMS request options.
 * Used purely for code readability
 * @param url
 * @param token
 * @returns
 */
const createSMSReqOptions = (
  url: string,
  token: string
): https.RequestOptions => {
  // split hostname and endpoint from url
  let hostname = "";
  let endpoint = "/";
  const breakingPoint = url.indexOf("/");
  if (breakingPoint === -1) {
    hostname = url;
  } else {
    hostname = url.slice(0, breakingPoint);
    endpoint = url.slice(breakingPoint);
  }

  return {
    hostname,
    path: [endpoint, `token=${token}`].join("?"),

    // a standard part of each SMS post request we're sending
    headers: { ["Content-Type"]: "application/json" },
    method: "POST",
  };
};

/**
 * A helper function transforming callback structure of request into promise
 * @param {RequestOptions} options request options
 * @param {Uint8Array} data serialized request body
 * @returns
 */
const postSMS = (options: https.RequestOptions, data: Uint8Array) =>
  new Promise((resolve, reject) => {
    // create POST request
    const req = https.request(options, (res) => {
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
    });

    // send request with provided data
    req.write(data);
    req.end();
  });

import * as functions from "firebase-functions";
import admin from "firebase-admin";

import {
  Collection,
  SendMailPayload,
  HTTPErrors,
  SendEmailErrors,
} from "eisbuk-shared";

import { checkUser } from "./utils";

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

    const { organization, ...email } = payload!;

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

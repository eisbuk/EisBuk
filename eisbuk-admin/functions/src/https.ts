import * as functions from "firebase-functions";
import admin from "firebase-admin";

import {
  Collection,
  SendMailPayload,
  HTTPErrors,
  SendEmailErrors,
} from "eisbuk-shared";

export const sendEmail = functions
  .region("europe-west6")
  .https.onCall(async (payload?: Partial<SendMailPayload>) => {
    // check payload
    if (!payload) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        HTTPErrors.NoPayload
      );
    }
    const { organization, message, to } = payload!;
    if (!organization) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendEmailErrors.NoOrganziation
      );
    }
    if (!to) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendEmailErrors.NoRecipient
      );
    }
    if (!message?.html) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendEmailErrors.NoMsgBody
      );
    }
    if (!message?.subject) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        SendEmailErrors.NoSubject
      );
    }

    const email = {
      to,
      message,
    };

    // add email to firestore, firing data trigger
    await admin.firestore().collection(Collection.EmailQueue).doc().set(email);

    return { ...payload, success: true };
  });

import functions from "firebase-functions";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

import {
  SendMailPayload,
  Collection,
  OrgSubCollection,
  OrganizationData,
  EmailMessage,
  OrganizationSecrets,
} from "@eisbuk/shared";
import processDelivery, {
  ProcessDocument,
} from "@eisbuk/firestore-process-delivery";

import { __functionsZone__ } from "./constants";

import { checkUser, checkRequiredFields } from "./utils";

/**
 * Stores email data to `emailQueue` collection, triggering firestore-send-email extension.
 */
export const sendEmail = functions
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization, ...payload }: SendMailPayload, { auth }) => {
      await checkUser(organization, auth);

      checkRequiredFields(payload, ["to", "subject", "html"]);

      // add email to firestore, firing data trigger
      await admin
        .firestore()
        .collection(
          `${Collection.Organizations}/${organization}/${OrgSubCollection.EmailQueue}`
        )
        .doc()
        .set({ payload });

      return { email: payload, organization, success: true };
    }
  );

/**
 * Reads SMTP config and creates an SMTP transport layer.
 * @param organization organization name
 * @returns nodemailers `Transport` object
 */
const getTransportLayer = async (organization: string) => {
  const mailConfig = await getMailConfig(organization);
  return nodemailer.createTransport(mailConfig);
};

interface MailConfig {
  host: string;
  port: number;
  secure: true;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Reads smtp config from `organization` config as well as `secrets` and validates the fields.
 * @param organization organization name
 * @returns smtp config options
 */
const getMailConfig = async (organization: string): Promise<MailConfig> => {
  const db = admin.firestore();

  const [secretsSnap, orgSnap] = await Promise.all([
    db.doc(`${Collection.Secrets}/${organization}`).get(),
    db.doc(`${Collection.Organizations}/${organization}`).get(),
  ]);

  const secrets = secretsSnap.data() as OrganizationSecrets;
  const { emailFrom } = orgSnap.data() as OrganizationData;

  const config = {};
  const errors = [];

  if (!secrets.smtpHost) {
    errors.push("No host");
  } else if (typeof secrets.smtpHost !== "string") {
    errors.push("Host should be string");
  } else {
    config["host"] = secrets.smtpHost;
  }

  if (!secrets.smtpPort) {
    errors.push("No port");
  } else if (typeof secrets.smtpPort !== "number") {
    errors.push("Port should be number");
  } else {
    config["port"] = secrets.smtpPort;
  }

  if (!secrets.smtpUser) {
    errors.push("No user");
  } else {
    config["auth"] = { user: secrets.smtpUser };
  }

  if (!secrets.smtpPass) {
    errors.push("No pass");
  } else {
    config["auth"].pass = secrets.smtpPass;
  }

  if (!emailFrom) {
    errors.push("No email from");
  } else if (!isValidEmail(emailFrom)) {
    errors.push("email from invalid");
  } else {
    config["from"] = emailFrom;
  }

  if (errors.length) {
    throw new Error(errors.join(" ** "));
  }

  return config as MailConfig;
};

export const deliverEmail = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.EmailQueue}/{emailDoc}`
  )
  .onWrite((change, { params }) =>
    processDelivery(change, async () => {
      const { organization } = params;

      const data = change.after.data() as ProcessDocument<EmailMessage>;
      const email = { ...data.payload, from: "eisbuk@team.com" };

      const transport = await getTransportLayer(organization);

      functions.logger.info("Sending mail:", email);

      const result = await transport.sendMail(email);

      const info = {
        messageId: result.messageId || null,
        accepted: result.accepted || [],
        rejected: result.rejected || [],
        pending: result.pending || [],
        response: result.response || null,
      };

      return info;
    })
  );

/** @TODO move to shared at some point */
const isValidEmail = (email: string) =>
  /^[-_.a-z0-9A-Z]*@[-_.a-z0-9A-Z]*\.[a-z][a-z]+$/.test(email);

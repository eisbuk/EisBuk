import functions from "firebase-functions";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

import {
  Collection,
  OrganizationData,
  OrganizationSecrets,
  DeliveryQueue,
  EmailPayload,
} from "@eisbuk/shared";
import processDelivery, {
  ProcessDocument,
} from "@eisbuk/firestore-process-delivery";

import { SMTPSettings, TransportConfig } from "./types";

import { __functionsZone__, __noSecretsError } from "../constants";

import { EmailSchema, SMTPConfigSchema } from "./validations";
import { validateJSON } from "../utils";

/**
 * Reads smtp config from `organization` config as well as `secrets` and validates the fields.
 * @param organization organization name
 * @returns smtp config options
 */
const getMailConfig = async (
  organization: string
): Promise<TransportConfig> => {
  const db = admin.firestore();

  const secretsSnap = await db
    .doc(`${Collection.Secrets}/${organization}`)
    .get();

  const secretsData = secretsSnap.data() as OrganizationSecrets | undefined;
  if (!secretsData) {
    throw new Error(__noSecretsError);
  }
  const { smtpHost, smtpPass, smtpPort, smtpUser } = secretsData;

  const smtpConfig = validateJSON<SMTPSettings>(
    SMTPConfigSchema,
    {
      smtpHost,
      smtpPass,
      smtpPort,
      smtpUser,
    },
    "Invalid SMTP config (check your organization preferences):"
  );

  return {
    host: smtpConfig.smtpHost,
    port: smtpConfig.smtpPort,
    auth: {
      user: smtpConfig.smtpUser,
      pass: smtpConfig.smtpPass,
    },
    secure: smtpPort === 465,
  };
};

/**
 * Reads SMTP config and creates an SMTP transport layer.
 * @param organization organization name
 * @returns nodemailers `Transport` object
 */
const getTransportLayer = async (organization: string) => {
  const mailConfig = await getMailConfig(organization);
  return nodemailer.createTransport(mailConfig);
};
// #endregion transportLayer

/**
 * An email delivery functionality, uses a firestore document with path:
 *
 * `deliveryQueue/{ organization }/emailQueue/{ email }`
 *
 * The document is used as a data trigger to start the delivery as well as a process
 * document to log the delivery state to.
 * Under the hood uses the `processDelivery` from `@eisbuk/firestore-process-delivery`
 * to attempt delivery, retry and log delivery state accordingly.
 */
export const deliverEmail = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.DeliveryQueues}/{organization}/${DeliveryQueue.EmailQueue}/{emailDoc}`
  )
  .onWrite((change, { params }) =>
    processDelivery(change, async () => {
      const { organization } = params;

      const transport = await getTransportLayer(organization);

      // Get current email payload
      const data = change.after.data() as Partial<
        ProcessDocument<EmailPayload>
      >;

      // Get email preferences from organization info (such as 'fromEmail')
      const db = admin.firestore();
      const orgSnap = await db
        .doc(`${Collection.Organizations}/${organization}`)
        .get();
      const { emailFrom } = orgSnap.data() as OrganizationData;

      // Validate email and throw if not a valid schema
      const email = validateJSON(
        EmailSchema,
        {
          from: emailFrom,
          ...data.payload,
        },
        "Error constructing email (check the email payload and organization preferences):"
      );

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

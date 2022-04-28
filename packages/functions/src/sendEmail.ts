import functions from "firebase-functions";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import { JSONSchemaType } from "ajv";

import {
  SendMailPayload,
  Collection,
  OrganizationData,
  EmailMessage,
  OrganizationSecrets,
  DeliveryQueue,
} from "@eisbuk/shared";
import processDelivery, {
  ProcessDocument,
} from "@eisbuk/firestore-process-delivery";

import {
  __functionsZone__,
  emailPattern,
  __invalidEmailError,
  __noSecretsError,
} from "./constants";

import { checkUser, checkRequiredFields, validateJSON } from "./utils";

// #region httpsEndpoint
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
          `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.EmailQueue}`
        )
        .doc()
        .set({ payload });

      return { email: payload, organization, success: true };
    }
  );
// #endregion httpsEndpoint

// #region transportLayer
interface TransportConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}
interface SMTPSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
}

const smtpConfigSchema: JSONSchemaType<SMTPSettings> = {
  properties: {
    smtpHost: { type: "string" },
    smtpPort: { type: "integer" },
    smtpUser: { type: "string" },
    smtpPass: { type: "string" },
  },
  type: "object",
  required: ["smtpHost", "smtpPort"],
};

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
    smtpConfigSchema,
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

// #region delivery
type SendEmailObject = EmailMessage & { from: string };

const EmailSchema: JSONSchemaType<SendEmailObject> = {
  properties: {
    from: {
      type: "string",
      pattern: emailPattern,
      errorMessage: __invalidEmailError,
    },
    to: {
      type: "string",
      pattern: emailPattern,
      errorMessage: __invalidEmailError,
    },
    subject: { type: "string" },
    html: { type: "string" },
  },
  additionalProperties: false,
  type: "object",
  required: ["from", "html", "subject", "to"],
};

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
        ProcessDocument<EmailMessage>
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
// #endregion delivery

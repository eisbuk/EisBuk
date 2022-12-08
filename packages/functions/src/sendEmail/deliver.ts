import functions from "firebase-functions";
import nodemailer from "nodemailer";

import { Collection, DeliveryQueue, EmailPayload } from "@eisbuk/shared";
import processDelivery, {
  ProcessDocument,
} from "@eisbuk/firestore-process-delivery";

import { SMTPPreferences, TransportConfig } from "./types";

import { __functionsZone__ } from "../constants";

import { EmailMessageSchema, SMTPPreferencesSchema } from "./validations";
import { getSMTPPreferences, validateJSON } from "../utils";

/**
 * Process SMTP preferences (read from organization secrets) into
 * a nodemailer transport config
 */
const processSMTPPreferences = ({
  smtpHost,
  smtpPass,
  smtpPort,
  smtpUser,
}: SMTPPreferences): TransportConfig => ({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,

  // Add `auth` field only if auth data provided
  ...(smtpUser || smtpPass
    ? {
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }
    : {}),
});
// #region SMTPPreferences

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
    processDelivery(change, async ({ success, error }) => {
      const { organization } = params;

      // Get transport layer
      const partialSMTPPreferences = await getSMTPPreferences(organization);
      const [SMTPPreferences, configErrs] = validateJSON<SMTPPreferences>(
        SMTPPreferencesSchema,
        partialSMTPPreferences,
        "Invalid SMTP config (check your organization preferences), following validation errors occurred:"
      );
      if (configErrs) {
        functions.logger.info("SMTP setup failed with errors", {
          errors: configErrs,
        });
        return error(configErrs);
      }
      const smtpConfig = processSMTPPreferences(SMTPPreferences);
      const transport = nodemailer.createTransport({
        ...smtpConfig,
        /** @OTODO check this: this is temporarily set for testing purposes, but we might use it in production?? */
        tls: { rejectUnauthorized: false },
      });

      // Get current email payload
      const data = change.after.data() as Partial<
        ProcessDocument<EmailPayload>
      >;

      // Validate email and throw if not a valid schema
      const [email, emailErrs] = validateJSON(
        EmailMessageSchema,
        data.payload || {},
        "Constructing gave following errors (check the email payload and organization preferences):"
      );
      if (emailErrs) {
        functions.logger.info("Email delivery failed with errors", {
          errors: emailErrs,
        });
        return error(emailErrs);
      }

      functions.logger.info("Sending mail:", email);
      const result = await transport.sendMail(email);

      // Store send mail response to process document with success result
      return success({
        messageId: result.messageId || null,
        accepted: result.accepted || [],
        rejected: result.rejected || [],
        pending: result.pending || [],
        response: result.response || null,
      });
    })
  );

import { JSONSchemaType } from "ajv";

import { EmailAttachment, EmailPayload } from "@eisbuk/shared";

import { SMTPPreferences } from "./types";

// #region constants
export const emailPattern = "^[-_.a-z0-9A-Z]*@[-_.a-z0-9A-Z]*[.][a-z][a-z]+$";
export const __invalidEmailError = "must be a valid email string";
// #endregion constants

// #region validations
/**
 * Validation for full SMTP config (used to create an SMTP transport layer).
 */
export const SMTPPreferencesSchema: JSONSchemaType<SMTPPreferences> = {
  type: "object",
  required: ["smtpHost", "smtpPort"],
  properties: {
    smtpHost: { type: "string" },
    smtpPort: { type: "integer" },
    smtpUser: { type: "string" },
    smtpPass: { type: "string" },
  },
};

/**
 * A validation schema for an attachment item in email payload
 */
const EmailAttachmentSchema: JSONSchemaType<EmailAttachment> = {
  type: "object",
  required: ["content", "filename"],
  properties: {
    filename: {
      type: "string",
    },
    content: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "object",
          required: [],
        },
      ],
    },
  },
};

/**
 * Validation schema for a fully constructed email (to be send over SMTP),
 * including `to`, `from` and valid `message`
 */
export const EmailMessageSchema: JSONSchemaType<EmailPayload> = {
  type: "object",
  required: ["from", "to", "subject"],
  properties: {
    from: {
      type: "string",
      pattern: emailPattern,
      errorMessage: __invalidEmailError,
    },
    bcc: {
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
    attachments: {
      type: "array",
      items: EmailAttachmentSchema,
      nullable: true,
    },
  },
};
// #region validations

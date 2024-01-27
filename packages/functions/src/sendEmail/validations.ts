import { JSONSchemaType } from "ajv";

import {
  EmailAttachment,
  EmailPayload,
  ClientMessagePayload,
  ClientMessageType,
  ClientMessageMethod,
  emailValidationPattern,
} from "@eisbuk/shared";

import { SMTPPreferences } from "./types";

// #region constants
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
 * Validation schema for a fully constructed email (to be sent over SMTP),
 * including `to`, `from`, `bcc` and `html`
 */
export const EmailPayloadSchema: JSONSchemaType<EmailPayload> = {
  type: "object",
  required: ["from", "to", "subject"],
  properties: {
    from: {
      type: "string",
      pattern: emailValidationPattern,
      errorMessage: __invalidEmailError,
    },
    bcc: {
      type: "string",
      pattern: emailValidationPattern,
      errorMessage: __invalidEmailError,
      nullable: true,
    },
    to: {
      type: "string",
      pattern: emailValidationPattern,
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

/**
 * Validation schema for a ics email payload
 */
export const SendICSEmailSchema: JSONSchemaType<
  ClientMessagePayload<
    ClientMessageMethod.Email,
    ClientMessageType.SendCalendarFile
  >
> = {
  type: "object",
  required: [
    "type",
    "organization",
    "name",
    "surname",
    "email",
    "secretKey",
    "attachments",
  ],
  properties: {
    type: {
      type: "string",
      errorMessage: "Email type missing",
    },
    organization: {
      type: "string",
      errorMessage: "Missing organization",
    },
    name: {
      type: "string",
      errorMessage: "Missing customer name",
    },
    surname: {
      type: "string",
      errorMessage: "Missing customer surname",
    },
    email: {
      type: "string",
      errorMessage: "Missing customer email",
    },
    secretKey: {
      type: "string",
      errorMessage: "Missing secretKey",
    },
    attachments: EmailAttachmentSchema,
  },
};

/**
 * Validation schema for an ExtendDate email payload
 */
export const SendExtendDateEmailSchema: JSONSchemaType<
  ClientMessagePayload<
    ClientMessageMethod.Email,
    ClientMessageType.SendExtendedBookingsDate
  >
> = {
  type: "object",
  required: [
    "type",
    "organization",
    "name",
    "surname",
    "email",
    "bookingsMonth",
    "extendedBookingsDate",
  ],
  properties: {
    type: {
      type: "string",
      errorMessage: "Email type missing",
    },
    organization: {
      type: "string",
      errorMessage: "Missing organization",
    },
    name: {
      type: "string",
      errorMessage: "Missing customer name",
    },
    surname: {
      type: "string",
      errorMessage: "Missing customer surname",
    },
    email: {
      type: "string",
      errorMessage: "Missing customer email",
    },
    bookingsMonth: {
      type: "string",
      errorMessage: "Missing bookingsMonth",
    },
    extendedBookingsDate: {
      type: "string",
      errorMessage: "Missing extendedBookingsDate",
    },
  },
};

/**
 * Validation schema for a bookingsLink email payload
 */
export const SendBookingsLinkEmailSchema: JSONSchemaType<
  ClientMessagePayload<
    ClientMessageMethod.Email,
    ClientMessageType.SendBookingsLink
  >
> = {
  type: "object",
  required: [
    "type",
    "organization",
    "name",
    "surname",
    "email",
    "bookingsLink",
  ],
  properties: {
    type: {
      type: "string",
      errorMessage: "Email type missing",
    },
    organization: {
      type: "string",
      errorMessage: "Missing organization",
    },
    name: {
      type: "string",
      errorMessage: "Missing customer name",
    },
    surname: {
      type: "string",
      errorMessage: "Missing customer surname",
    },
    email: {
      type: "string",
      errorMessage: "Missing customer email",
    },
    bookingsLink: {
      type: "string",
      errorMessage: "Missing bookingsLink",
    },
  },
};

// #region validations

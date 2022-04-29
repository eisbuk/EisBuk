import { JSONSchemaType } from "ajv";

import { EmailAttachment, EmailMessage, Email } from "@eisbuk/shared";

import { emailPattern, __invalidEmailError } from "./constants";

// #region email
export interface SMTPSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
}

/**
 * Validation for full SMTP config (used to create an SMTP transport layer).
 */
export const SMTPConfigSchema: JSONSchemaType<SMTPSettings> = {
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
 * A validation schema for a `message` (`subject`, `html`, `attachments`) field of an email interface
 */
const EmailMessageSchema: JSONSchemaType<EmailMessage> = {
  type: "object",
  required: ["html", "subject"],
  properties: {
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
 * Validation schema for a fully constructed email (to be send over SMTP),
 * including `to`, `from` and valid `message`
 */
export const EmailSchema: JSONSchemaType<Email> = {
  type: "object",
  required: ["from", "to", "message"],
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
    message: EmailMessageSchema,
  },
};
// #endregion email

// #region sms
interface SMSRecipient {
  msisdn: string;
}

interface SendSMSObject {
  message: string;
  smsFrom: string;
  recipients: SMSRecipient[];
}

const SMSRecipientSchema: JSONSchemaType<SMSRecipient> = {
  type: "object",
  properties: { msisdn: { type: "string" } },
  required: ["msisdn"],
};

export const SendSMSObjectSchema: JSONSchemaType<SendSMSObject> = {
  type: "object",
  required: ["message", "smsFrom", "recipients"],
  properties: {
    message: { type: "string" },
    smsFrom: {
      type: "string",
      maxLength: 11,
      errorMessage:
        // eslint-disable-next-line no-template-curly-in-string
        "should be a string with max 11 characters, received: ${/smsFrom}",
    },
    recipients: {
      type: "array",
      items: SMSRecipientSchema,
      maxItems: 1,
    },
  },
};
// #endregion sms

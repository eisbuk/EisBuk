import { JSONSchemaType } from "ajv";

import {
  EmailAttachment,
  EmailPayload,
  ClientEmailPayload,
  EmailType,
  SendCalendarFileCustomer,
  SendBookingsLinkCustomer,
  SendExtendedBookingLinkCustomer,
} from "@eisbuk/shared";

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
 * A validation schema for customer field in bookingsLink email payload
 */
const SendBookingsLinkCustomerSchema: JSONSchemaType<SendBookingsLinkCustomer> =
  {
    type: "object",
    required: ["name", "surname", "email"],
    properties: {
      name: {
        type: "string",
      },
      surname: {
        type: "string",
      },
      email: {
        type: "string",
        pattern: emailPattern,
        errorMessage: __invalidEmailError,
      },
    },
  };

/**
 * A validation schema for customer field in bookingsLink email payload
 */
const SendExtendedBookingLinkCustomerSchema: JSONSchemaType<SendExtendedBookingLinkCustomer> =
  {
    type: "object",
    required: ["name", "surname", "email"],
    properties: {
      name: {
        type: "string",
      },
      surname: {
        type: "string",
      },
      email: {
        type: "string",
        pattern: emailPattern,
        errorMessage: __invalidEmailError,
      },
    },
  };

/**
 * A validation schema for customer field in bookingsLink email payload
 */
const SendCalendarFileCustomerSchema: JSONSchemaType<SendCalendarFileCustomer> =
  {
    type: "object",
    required: ["name", "surname", "secretKey", "email"],
    properties: {
      name: {
        type: "string",
      },
      surname: {
        type: "string",
      },
      email: {
        type: "string",
        pattern: emailPattern,
        errorMessage: __invalidEmailError,
      },
      secretKey: {
        type: "string",
      },
    },
  };

/**
 * Validation schema for a fully constructed email (to be send over SMTP),
 * including `to`, `from`, `bcc` and `html`
 */
export const EmailPayloadSchema: JSONSchemaType<EmailPayload> = {
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

/**
 * Validation schema for a ics email payload
 */
export const SendICSEmailSchema: JSONSchemaType<
  ClientEmailPayload[EmailType.SendCalendarFile]
> = {
  type: "object",
  required: ["type", "organization", "customer", "attachments"],
  properties: {
    type: {
      type: "string",
      errorMessage: "Email type missing",
    },
    organization: {
      type: "string",
      errorMessage: "Missing organization",
    },
    customer: SendCalendarFileCustomerSchema,
    attachments: EmailAttachmentSchema,
  },
};

/**
 * Validation schema for an ExtendDate email payload
 */

export const SendExtendDateEmailSchema: JSONSchemaType<
  ClientEmailPayload[EmailType.SendExtendedBookingsDate]
> = {
  type: "object",
  required: [
    "type",
    "organization",
    "customer",
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
    bookingsMonth: {
      type: "string",
      errorMessage: "Missing bookingsMonth",
    },
    extendedBookingsDate: {
      type: "string",
      errorMessage: "Missing extendedBookingsDate",
    },
    customer: SendExtendedBookingLinkCustomerSchema,
  },
};

/**
 * Validation schema for a bookingsLink email payload
 */
export const SendBookingsLinkEmailSchema: JSONSchemaType<
  ClientEmailPayload[EmailType.SendBookingsLink]
> = {
  type: "object",
  required: ["type", "organization", "customer", "bookingsLink"],
  properties: {
    type: {
      type: "string",
      errorMessage: "Email type missing",
    },
    organization: {
      type: "string",
      errorMessage: "Missing organization",
    },
    bookingsLink: {
      type: "string",
      errorMessage: "Missing bookingsLink",
    },

    customer: SendBookingsLinkCustomerSchema,
  },
};

// #region validations

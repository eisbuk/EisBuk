import { JSONSchemaType } from "ajv";

import { SMSRecipient, SMS } from "./types";

const SMSRecipientSchema: JSONSchemaType<SMSRecipient> = {
  type: "object",
  properties: { msisdn: { type: "string" } },
  required: ["msisdn"],
};

export const SMSSchema: JSONSchemaType<SMS> = {
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

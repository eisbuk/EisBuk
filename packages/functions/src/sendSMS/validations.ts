import { JSONSchemaType } from "ajv";

import { SMSRecipient, SMSAPIPayloed } from "./types";

const SMSRecipientSchema: JSONSchemaType<SMSRecipient> = {
  type: "object",
  properties: { msisdn: { type: "string" } },
  required: ["msisdn"],
};

export const SMSAPIPayloadSchema: JSONSchemaType<SMSAPIPayloed> = {
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
    callback_url: { type: "string", nullable: true },
  },
};
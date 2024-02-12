import {
  ClientMessageMethod,
  ClientMessagePayload,
  ClientMessageType,
} from "@eisbuk/shared";
import { JSONSchemaType } from "ajv";

import { SMSRecipient, SMSAPIPayload } from "./types";

const SMSRecipientSchema: JSONSchemaType<SMSRecipient> = {
  type: "object",
  properties: { msisdn: { type: "string" } },
  required: ["msisdn"],
};

export const SMSAPIPayloadSchema: JSONSchemaType<SMSAPIPayload> = {
  type: "object",
  required: ["message", "sender", "recipients"],
  properties: {
    message: { type: "string" },
    sender: {
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

/**
 * Validation schema for an ExtendDate  payload
 */
export const SendExtendDateSMSSchema: JSONSchemaType<
  ClientMessagePayload<
    ClientMessageMethod.SMS,
    ClientMessageType.SendExtendedBookingsDate
  >
> = {
  type: "object",
  required: [
    "type",
    "organization",
    "name",
    "surname",
    "phone",
    "bookingsMonth",
    "extendedBookingsDate",
  ],
  properties: {
    type: {
      type: "string",
      errorMessage: "SMS type missing",
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
    phone: {
      type: "string",
      errorMessage: "Missing customer phone number",
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
 * Validation schema for a bookingsLink SMS payload
 */
export const SendBookingsLinkSMSSchema: JSONSchemaType<
  ClientMessagePayload<
    ClientMessageMethod.SMS,
    ClientMessageType.SendBookingsLink
  >
> = {
  type: "object",
  required: [
    "type",
    "organization",
    "name",
    "surname",
    "phone",
    "bookingsLink",
  ],
  properties: {
    type: {
      type: "string",
      errorMessage: "SMS type missing",
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
    phone: {
      type: "string",
      errorMessage: "Missing customer phone number",
    },
    bookingsLink: {
      type: "string",
      errorMessage: "Missing bookingsLink",
    },
    deadline: {
      type: "string",
      nullable: true,
    },
  },
};

import http from "http";
import { JSONSchemaType } from "ajv";

import {
  ClientMessageMethod,
  ClientMessagePayload,
  ClientMessageType,
  HTTPSErrors,
  MergeUnion,
} from "@eisbuk/shared";

import { SMSMessageType } from "./types";

import { __functionsZone__, __projectId__ } from "../constants";

import { EisbukHttpsError, validateJSON } from "../utils";
import {
  SendBookingsLinkSMSSchema,
  SendExtendDateSMSSchema,
} from "./validations";

/**
 * Validate client email payload accepts an email payload and applies the correct validation for an email type.
 */
export const validateSMSPayload = <T extends SMSMessageType>(
  payload: ClientMessagePayload<ClientMessageMethod.SMS, T>
) => {
  // Check that the type has been provided and is a supported email type
  if (
    !payload.type ||
    // Sending of ICS calendar over SMS is not suppoerted
    !Object.values([
      ClientMessageType.SendBookingsLink,
      ClientMessageType.SendExtendedBookingsDate,
    ]).includes(payload.type)
  ) {
    throw new EisbukHttpsError("invalid-argument", HTTPSErrors.SMSInvalidType);
  }

  type ValidationSchemaLookup = {
    [K in SMSMessageType]: JSONSchemaType<
      ClientMessagePayload<ClientMessageMethod.SMS, K>
    >;
  };
  const validationSchemaLookup: ValidationSchemaLookup = {
    [ClientMessageType.SendBookingsLink]: SendBookingsLinkSMSSchema,
    [ClientMessageType.SendExtendedBookingsDate]: SendExtendDateSMSSchema,
  };

  const [res, errors] = validateJSON(
    validationSchemaLookup[payload.type] as ValidationSchemaLookup[T],
    payload,
    "Constructing the email gave following errors (check the email payload and organization preferences):"
  );

  if (errors !== null) {
    throw new EisbukHttpsError("invalid-argument", errors.join(" "));
  }

  return res as MergeUnion<ClientMessagePayload<ClientMessageMethod.SMS, T>>;
};

/**
 * A convenience method used to create SMS request options.
 * Used purely for code readability
 * @param url
 * @param token
 * @returns
 */
export const createSMSReqOptions = (
  method: "GET" | "POST",
  url: string,
  token: string
): http.RequestOptions & { proto: "http" | "https" } => {
  let proto: "http" | "https" = "https";
  let hostname = "";
  let endpoint = "/";
  let portString = "";

  // check for protocol in url string (the fallback is https)
  if (/^https?:\/\//.test(url)) {
    [proto, hostname] = url.split("://") as ["http" | "https", string];
  } else {
    hostname = url;
  }

  // split hostname and endpoint from url
  const breakingPoint = hostname.indexOf("/");
  if (breakingPoint !== -1) {
    endpoint = hostname.slice(breakingPoint);
    hostname = hostname.slice(0, breakingPoint);
  }

  // check for port number
  if (hostname.includes(":")) {
    [hostname, portString] = hostname.split(":");
  }

  const port = Number(portString) || undefined;

  return {
    proto,
    hostname,
    path: [endpoint, `token=${token}`].join("?"),
    port,
    // a standard part of each SMS post request we're sending
    headers: { ["Content-Type"]: "application/json" },
    method,
  };
};

/**
 * Creates an URL of and endpoint for `updateSMSSStatus` for GatewayAPI status update.
 */
export const getSMSCallbackUrl = (): string =>
  `https://${__functionsZone__}-${__projectId__}.cloudfunctions.net/sendSMS`;

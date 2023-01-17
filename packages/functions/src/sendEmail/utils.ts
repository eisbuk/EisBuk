import { JSONSchemaType } from "ajv";

import {
  EmailTemplate,
  EmailType,
  ClientEmailPayload,
  interpolateText,
  MergeUnion,
  HTTPSErrors,
  EmailInterpolationValues,
} from "@eisbuk/shared";

import { EisbukHttpsError, validateJSON } from "../utils";
import {
  SendBookingsLinkEmailSchema,
  SendExtendDateEmailSchema,
  SendICSEmailSchema,
} from "./validations";

/**
 * Validate client email payload accepts an email payload and applies the correct validation for an email type.
 */
export const validateClientEmailPayload = <T extends EmailType>(
  payload: ClientEmailPayload[T]
) => {
  // Check that the type has been provided and is a supported email type
  if (!payload.type || !Object.values(EmailType).includes(payload.type)) {
    throw new EisbukHttpsError(
      "invalid-argument",
      HTTPSErrors.EmailInvalidType
    );
  }

  type ValidationSchemaLookup = {
    [key in EmailType]: JSONSchemaType<ClientEmailPayload[key]>;
  };
  const validationSchemaLookup: ValidationSchemaLookup = {
    [EmailType.SendBookingsLink]: SendBookingsLinkEmailSchema,
    [EmailType.SendCalendarFile]: SendICSEmailSchema,
    [EmailType.SendExtendedBookingsDate]: SendExtendDateEmailSchema,
  };

  const [res, errors] = validateJSON(
    validationSchemaLookup[payload.type] as ValidationSchemaLookup[T],
    payload,
    "Constructing the email gave following errors (check the email payload and organization preferences):"
  );

  if (errors !== null) {
    throw new EisbukHttpsError("invalid-argument", errors.join(" "));
  }

  return res as MergeUnion<ClientEmailPayload[T]>;
};

/**
 * Takes in an email template ({ subject, html }) and interpolates both with values.
 * @param template
 * @param values
 * @returns the same structure as email template, only with values interpolated.
 */
export const interpolateEmail = (
  template: EmailTemplate,
  values: EmailInterpolationValues
) => ({
  subject: interpolateText(template.subject, values as Record<string, any>),
  html: interpolateText(template.html, values as Record<string, any>),
});

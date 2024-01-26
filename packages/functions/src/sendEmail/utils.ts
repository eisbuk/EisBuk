import { JSONSchemaType } from "ajv";
import * as admin from "firebase-admin";

import {
  EmailTemplate,
  ClientMessageType,
  ClientMessagePayload,
  interpolateText,
  MergeUnion,
  HTTPSErrors,
  EmailInterpolationValues,
  ClientMessageMethod,
  EmailPayload,
  Collection,
  DeliveryQueue,
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
export const validateClientEmailPayload = <T extends ClientMessageType>(
  payload: ClientMessagePayload<ClientMessageMethod.Email, T>
) => {
  // Check that the type has been provided and is a supported email type
  if (
    !payload.type ||
    !Object.values(ClientMessageType).includes(payload.type)
  ) {
    throw new EisbukHttpsError(
      "invalid-argument",
      HTTPSErrors.EmailInvalidType
    );
  }

  type ValidationSchemaLookup = {
    [key in ClientMessageType]: JSONSchemaType<
      ClientMessagePayload<ClientMessageMethod.Email, key>
    >;
  };
  const validationSchemaLookup: ValidationSchemaLookup = {
    [ClientMessageType.SendBookingsLink]: SendBookingsLinkEmailSchema,
    [ClientMessageType.SendCalendarFile]: SendICSEmailSchema,
    [ClientMessageType.SendExtendedBookingsDate]: SendExtendDateEmailSchema,
  };

  const [res, errors] = validateJSON(
    validationSchemaLookup[payload.type] as ValidationSchemaLookup[T],
    payload,
    "Constructing the email gave following errors (check the email payload and organization preferences):"
  );

  if (errors !== null) {
    throw new EisbukHttpsError("invalid-argument", errors.join(" "));
  }

  return res as MergeUnion<ClientMessagePayload<ClientMessageMethod.Email, T>>;
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

/**
 * A util used by different cloud functions to effectively send an email (by enqueueing it in the email delivery queue).
 * This is here as a type-safe, single-source-of-truth way of sending emails.
 */
export const enqueueEmailDelivery = async (
  organization: string,
  email: EmailPayload
) => {
  const deliveryDoc = admin
    .firestore()
    .collection(
      `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.EmailQueue}`
    )
    .doc();

  await deliveryDoc.set({
    payload: email,
  });

  return {
    // As part of the response we're returning the delivery document path.
    // This is mostly used for testing as we might want to wait for the delivery to be marked
    // successful before making further assertions
    deliveryDocumentPath: deliveryDoc.path,
    email,
    organization,
    success: true,
  };
};

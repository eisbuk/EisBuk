/* eslint-disable no-console */
import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/lib/providers/https";
import admin from "firebase-admin";
import http from "http";
import https from "https";
import { StringDecoder } from "string_decoder";
import Ajv, { ErrorObject, JSONSchemaType } from "ajv";
import customizeErrors from "ajv-errors";

import { DeliverResultTuple } from "@eisbuk/firestore-process-delivery";
import {
  Collection,
  CustomerBookingEntry,
  HTTPSErrors,
  OrgSubCollection,
  SlotType,
  SlotsByDay,
  calculateIntervalDuration,
} from "@eisbuk/shared";

type Auth = CallableContext["auth"];

/**
 * Round the given val to the nearest multiple of modbase
 * ```
 * roundTo(12, 5) === 10
 * roundTo(12, 4) === 12
 * roundTo(12, 7) === 7
 * roundTo(17, 4) === 16
 * ```
 * @param val
 * @param modbase
 * @returns
 */
export const roundTo = (val: number, modbase: number): number =>
  Math.floor(val / modbase) * modbase;

/**
 * Receives an organization name and an auth info object as
 * provided by the Firebase SDK. Returns a boolean promise
 * of whether or not the user is authorized to manage the given organization
 * @param organization
 * @param auth
 */
export const checkUser = async (
  organization?: string,
  auth?: Auth
): Promise<boolean | never> => {
  if (!organization || !auth || !auth.token) {
    return false;
  }

  const token = auth!.token!;
  const authString = token.email || token.phone_number;
  if (!authString) {
    return false;
  }

  const org = await admin
    .firestore()
    .collection(Collection.Organizations)
    .doc(organization!)
    .get();

  if (!isOrgAdmin(org.data()?.admins, auth)) return false;
  return true;
};

/**
 * Checks if provided organization has admin and
 * if user in fact is admin of said organization
 * @param admins array of admin credentials (email or name)
 * @param auth auth object of user we're checking out
 * @returns
 */
const isOrgAdmin = (admins: string[] | undefined, auth: Auth): boolean => {
  // fail early
  // if no admins are registered for the organization
  // or no auth is present
  if (!Array.isArray(admins) || !auth?.token) return false;

  const { email, phone_number: phoneNumber } = auth.token;

  return (email && admins.includes(email)) ||
    (phoneNumber && admins.includes(phoneNumber))
    ? true
    : false;
};

/**
 * Throws unauthorized https error
 */
export const throwUnauth = (): never => {
  throw new functions.https.HttpsError(
    "permission-denied",
    HTTPSErrors.Unauth,
    "The function must be called while authenticated with a user that is an admin of the given organization."
  );
};

/**
 * A way to "Authenticate" a non-logged in user
 * Receives an organization name and a secretKey
 * returns a boolean promise depending on whether a customer bookings
 * entry exists with that secretKey or not
 * @param args.organization
 * @param args.secretKey
 * @returns {Promise<boolean>}
 */
export const checkSecretKey = async ({
  secretKey,
  organization,
}: {
  secretKey: string;
  organization: string;
}): Promise<boolean> => {
  if (!secretKey) return false;
  const db = admin.firestore();
  const orgRef = db.collection(Collection.Organizations).doc(organization);

  const hasBooking = (
    await orgRef.collection(OrgSubCollection.Bookings).doc(secretKey).get()
  ).exists;

  return hasBooking;
};

/**
 * A helper function transforming callback structure of request into promise
 * @param {"http" | "https"} proto request protocol: "http" should be used only for testing
 * @param {RequestOptions} options request options
 * @param {Object} data (optional) JSON request body, to be serialized for request payload
 * @returns
 */
export const sendRequest = <
  Res extends Record<string, any> = Record<string, any>
>(
  proto: "http" | "https",
  options: http.RequestOptions,
  data?: Record<string, any>
): Promise<Res> =>
  new Promise<Res>((resolve, reject) => {
    // request handler will be the same regardless of protocol used ("http"/"https")
    const handleReq = (res: http.IncomingMessage) => {
      const decoder = new StringDecoder("utf-8");
      let resBody = "";

      // reject on error (and let the caller handle further)
      res.on("error", (err) => {
        reject(err);
      });

      res.on("data", (d) => {
        resBody += decoder.write(d);
      });

      // resolve promise on successful request
      res.on("end", () => {
        resBody += decoder.end();
        const resJSON: Res = JSON.parse(resBody);
        resolve(resJSON);
      });
    };

    // create a request using provided protocol
    const req =
      proto === "http"
        ? http.request(options, handleReq)
        : https.request(options, handleReq);

    // send request with provided data (if any)
    if (data) {
      const payload = JSON.stringify(data);
      req.write(payload);
    }
    req.end();
  });

type ErrorCode = functions.https.FunctionsErrorCode;

/** */
export class EisbukHttpsError extends functions.https.HttpsError {
  /**
   * A wrapper around `functions.https.HttpsError` used to log errors
   * to the functions console before returning gRPC error to the client
   * @param code `functions.https.FunctionsErrorCode`
   * @param message error message
   * @param details error details
   */
  constructor(code: ErrorCode, message: string, details?: unknown) {
    functions.logger.error(code, message, details);
    super(code, message, details);
  }
}

/**
 * A function wrapper used to enforce a timeout on async
 * operations with possibly long exectution period
 * @param fn an async function we want to execute within timeout boundary
 * @returns `fn`'s resolved value
 */
export const runWithTimeout = async <T>(
  fn: () => Promise<T>,
  { timeout } = { timeout: 5000 }
): Promise<T> => {
  // set a timeout boundry for a function
  const timeoutBoundary = setTimeout(() => {
    throw new functions.https.HttpsError("aborted", HTTPSErrors.TimedOut);
  }, timeout);

  const res = await fn();

  // clear timeout function (the `fn` has resolved within the timeout boundry)
  clearTimeout(timeoutBoundary);

  return res;
};

/**
 * Checks payload (or any other record structure) for required fields.
 * Throws error if one or more of the fields aren't present
 * @param payload record to validate
 * @param requiredFields array of field names (keys)
 * @param errorMessage (optional) customer error message on failure, falls back to
 * `HTTPSErrors.MissingParameter`
 */
export const checkRequiredFields = (
  payload: Record<string, any> | undefined | null,
  requiredFields: string[]
): void | never => {
  if (!payload) {
    throw new EisbukHttpsError("invalid-argument", HTTPSErrors.NoPayload);
  }

  const missingFields: string[] = [];

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      missingFields.push(field);
    }
  });

  if (missingFields.length) {
    const errorMessage = `${HTTPSErrors.MissingParameter}: ${missingFields.join(
      ", "
    )}`;

    throw new EisbukHttpsError("invalid-argument", errorMessage, {
      missingFields,
    });
  }
};

// #region JSONValidation
/**
 * Reads through provided JSON validation errors and constructs an array
 * of error messages (with some additional processing if needed)
 * @param {ErrorObject[]} errs array of ajv error objects
 * @param {string} prefix this string will be the first member of the erros array
 * if not provided, falls back to "JSON validation: the following errors occurred:"
 *
 * @returns an array of (string) error messages
 */
const constructValidationErrors = (
  errs: ErrorObject[],
  prefix = "JSON validation: the following errors occurred:"
): string[] => {
  // Unknown fields are natively handled a bit weirdly, therefore we're storing the
  // unkonwn fields in this list and constructing an error afterwards
  const unknownFields: string[] = [];

  // Process errors and add each (string) error message to the array
  const errorsArr = errs.reduce(
    (acc, { instancePath, message, keyword, params }) => {
      // For additional (unkonwn) properties we're not adding the error to the array
      // but just storing them in `unkonwnFields` for later use
      if (keyword === "additionalProperties" && params.additionalProperty) {
        unknownFields.push(`'${params.additionalProperty}'`);
        return acc;
      }

      // Remove starting "/" and replace further "/" steps with "." (the latter is for nested properties)
      const field = instancePath.slice(1).replace(/\//g, ".");

      const errorMessage = field
        ? `Error at field '${field}': "${message}"`
        : `Error: "${message}"`;

      return [...acc, errorMessage];
    },
    [prefix]
  );

  // If unkonwn fields found, add the 'unkonwn fields' error at the end of the errorsArr
  if (unknownFields.length) {
    errorsArr.push(
      "Object can specify only known fields, unkonwn fields found: " +
        unknownFields.join(", ")
    );
  }

  return errorsArr;
};

/**
 * Validates a JSON object, using Ajv JSON validator, with respect to provided schema.
 * The schema supports custom `errorMessages` defined using `ajv-errors`:
 *
 * https://www.npmjs.com/package/ajv-errors
 *
 * If any errors encountered, the function processes the ajv errors into error message strings
 * and returns them as an array
 *
 * Additionally, the function accepts a type parameter representing interface of the validated object,
 * if provided, upon successul validation the function also type casts the return type to a required one (validated one)
 *
 * @param schema JSON validation schema
 * @param object object to validate
 * @returns `[validatedObject, errorsArray, emptyMetadataObject]` tuple
 */
export const validateJSON = <T extends Record<string, any>>(
  schema: JSONSchemaType<T>,
  object: Record<string, any>,
  prefix?: string
): DeliverResultTuple<any, T> => {
  // Set up Ajv instance with custom error messages (read from schema)
  const ajv = new Ajv({ allErrors: true });
  customizeErrors(ajv);

  // Validate object with respect to schema
  const validate = ajv.compile<T>(schema);

  if (validate(object)) {
    // Return validated object as type safe
    return [object, null, {}];
  }

  // If not validated, return errors
  return [null, constructValidationErrors(validate.errors || [], prefix), {}];
};
// #endregion JSONValidation

/**
 * Calculates the total duration of booked slots for a customer, categorized by month and slot type.
 *
 * @param bookedSlots - An object containing the booked slots for a customer, keyed by slot ID.
 * @param monthSlots - An object representing the slots available in the month which they booked, keyed by date.
 * @param monthStr - A string representing the month which they booked.
 * @returns An object containing the aggregated duration of ice and off-ice slots for the booked month.
 */
export const getCustomerStats = (
  bookedSlots: { [slotId: string]: CustomerBookingEntry },
  monthSlots: SlotsByDay,
  monthStr: string
): Record<string, { ice: number; offIce: number }> => {
  if (!bookedSlots || !monthSlots) return { [monthStr]: { ice: 0, offIce: 0 } };
  return Object.entries(bookedSlots).reduce(
    (acc, [key, bookedSlot]) => {
      // Some non-conformity exists in slot ids where the id could either be the date-intervalStart or a uuid
      const dayStr = bookedSlot.date;
      const isInMonth =
        bookedSlot.date.substring(0, 7) === monthStr &&
        Object.keys(monthSlots).length &&
        monthSlots[dayStr];

      if (!isInMonth) return acc;
      const daySlots = monthSlots[dayStr];

      const duration = calculateIntervalDuration(bookedSlot.interval);

      // Check type and accumulate durations accordingly
      if (daySlots[key] && daySlots[key].type === SlotType.Ice) {
        acc[monthStr].ice += duration;
      } else if (daySlots[key] && daySlots[key].type === SlotType.OffIce) {
        acc[monthStr].offIce += duration;
      }
      return acc;
    },
    {
      [monthStr]: { ice: 0, offIce: 0 },
    }
  );
};

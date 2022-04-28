/* eslint-disable no-console */
import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/lib/providers/https";
import admin from "firebase-admin";
import http from "http";
import https from "https";
import { StringDecoder } from "string_decoder";
import Ajv, { ErrorObject, JSONSchemaType } from "ajv";
import customizeErrors from "ajv-errors";

import { Collection, HTTPSErrors } from "@eisbuk/shared";

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
 * provided by the Firebase SDK. Raises an unauthorized exception
 * if the user is not authorized to manage the given organization
 * @param organization
 * @param auth
 */
export const checkUser = async (
  organization?: string,
  auth?: Auth
): Promise<void | never> => {
  if (!organization || !auth || !auth.token) {
    throwUnauth();
  }

  const token = auth!.token!;
  const authString = token.email || token.phone_number;
  if (!authString) {
    throwUnauth();
  }

  const org = await admin
    .firestore()
    .collection(Collection.Organizations)
    .doc(organization!)
    .get();

  if (!isOrgAdmin(org.data()?.admins, auth)) throwUnauth();
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
const throwUnauth = (): never => {
  throw new functions.https.HttpsError(
    "permission-denied",
    HTTPSErrors.Unauth,
    "The function must be called while authenticated with a user that is an admin of the given organization."
  );
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
export const runWithTimeout = async <T extends any>(
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
 * Reads through the provided JSON validation errors and constructs a single
 * string error message *
 * @param {ErrorObject[]} errs array of ajv error objects
 * @param prefix final error message string prefix (defaults to `"Errors found:"`)
 * @returns a single error message string in following format:
 * `Errors found: 1) Error found at field [<firstErrorField>]: "first error message" ** 2) Error found at field [<secondErrorField>]: "second error message"`
 */
// const constructValidationErrors = (
//   errs: ErrorObject[],
//   prefix = "Errors found:"
// ): string => {
//   const errors = errs.map(({ instancePath, message }, i) => {
//     // Remove starting "/" and replace further "/" steps with "." (latter is for nested properties)
//     const field = instancePath.slice(1).replace(/\//g, ".");

//     const errorMessage = instancePath
//       ? `Error at field '${field}': "${message}"`
//       : `Error: "${message}"`;

//     return `${i + 1})` + " " + errorMessage;
//   });

//   return prefix + " " + errors.join("  **  ");
// };

const constructValidationErrors = (
  errs: ErrorObject[],
  prefix = "Errors found:"
): string => {
  /** Create a numbered error message string in format: `1) Example error message` */
  const createErrMessageString = (message: string, i: number) =>
    `${i}) ${message}`;

  // Unknown fields are natively handled a bit weirdly, therefore we're storing the
  // unkonwn fields in this list and constructing an error afterwards
  const unknownFields: string[] = [];
  // Error counter used to append the additinal 'unknown fields' error after all of the other errors
  let numErrs = 0;

  // Combine all of the 'regular' error messages in a single error string
  const errorMessage = errs.reduce(
    (acc, { instancePath, message, keyword, params }, i) => {
      // For additional (unkonwn) properties we're not adding the error to a final error string
      // but just storing them in `unkonwnFields` for later use
      // functions.logger.log("Keyword:", keyword);
      // functions.logger.log(
      //   "Keyword additional props:",
      //   keyword === "additionalProperties"
      // );
      // functions.logger.log("Params:", params);
      // functions.logger.log(
      //   "Params.additionalProperties:",
      //   params.additionalProperties
      // );

      if (keyword === "additionalProperties" && params.additionalProperty) {
        unknownFields.push(`'${params.additionalProperty}'`);
        return acc;
      }

      // Remove starting "/" and replace further "/" steps with "." (the latter is for nested properties)
      const field = instancePath.slice(1).replace(/\//g, ".");

      const errorMessage = instancePath
        ? `Error at field '${field}': "${message}"`
        : `Error: "${message}"`;

      // Apply separator to all but the first error
      const sep = i === 0 ? " " : "  **  ";

      numErrs++;

      return acc + sep + createErrMessageString(errorMessage, i + 1);
    },
    prefix
  );

  // If unkonwn fields found, add the 'unkonwn fields' error at the end of the
  // final error string
  if (unknownFields.length) {
    const unknownFieldsError =
      "Object can specify only known fields, unkonwn fields found: " +
      unknownFields.join(", ");

    // Don't apply "**" separator if no other errors
    const sep = numErrs === 0 ? " " : "  **  ";

    return (
      errorMessage +
      sep +
      createErrMessageString(unknownFieldsError, numErrs + 1)
    );
  }

  return errorMessage;
};

/**
 * Validates a JSON object, using Ajv JSON validator, with respect to provided schema.
 * The schema supports custom `errorMessages` defined using `ajv-errors`:
 *
 * https://www.npmjs.com/package/ajv-errors
 *
 * If any errors encountered, the function combines all of the validation messages in one strings
 * and throws an exception with that string as a message.
 *
 * Additionally, the function accepts a type parameter representing interface of the validated object,
 * if provided, upon successul validation the function also serves as a type guard casting the returned type
 * to a required one (validated one)
 *
 * @param schema JSON validation schema
 * @param object object to validate
 * @param errorPrefix a string used to prefix the error string, defaults to `"Errors found:"`
 * @returns a validated object
 */
export const validateJSON = <T extends Record<string, any>>(
  schema: JSONSchemaType<T>,
  object: Record<string, any>,
  errorPrefix = "Errors found:"
): T => {
  // Set up Ajv instance with custom error messages (read from schema)
  const ajv = new Ajv({ allErrors: true });
  customizeErrors(ajv);

  // Validate object with respect to schema
  ajv.validate<T>(schema, object);

  // Throw errors, if any
  const errors = ajv.errors;
  if (errors?.length) {
    const errorMessage = constructValidationErrors(errors, errorPrefix);
    throw new Error(errorMessage);
  }

  // Return validated object as type safe
  return object as T;
};
// #endregion JSONValidation

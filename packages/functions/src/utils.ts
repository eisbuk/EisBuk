/* eslint-disable no-console */
import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/lib/providers/https";
import admin from "firebase-admin";
import http from "http";
import https from "https";
import { StringDecoder } from "string_decoder";

import {
  Collection,
  Customer,
  HTTPSErrors,
  OrgSubCollection,
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
 * returns a boolean promise depending on whether a booking
 * exists with that secretKey or not
 * @param args.organization
 * @param args.secretKey
 * @returns {Promise<boolean>}
 */
export const checkSecretKey = async ({
  secretKey,
  organization,
}: {
  secretKey: Customer["secretKey"];
  organization: string;
}): Promise<boolean> => {
  const db = admin.firestore();
  const orgRef = db.collection(Collection.Organizations).doc(organization);

  const hasBooking = (
    await orgRef.collection(OrgSubCollection.Bookings).doc(secretKey).get()
  ).exists;

  return hasBooking;
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

/* eslint-disable no-console */
import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/lib/providers/https";
import admin from "firebase-admin";
import http from "http";
import https from "https";
import { StringDecoder } from "string_decoder";

import { Collection, HTTPErrors } from "eisbuk-shared";

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
    HTTPErrors.Unauth,
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

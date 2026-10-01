import * as Sentry from "@sentry/serverless";
import type { Event } from "@sentry/types";
import * as functions from "firebase-functions";

import { scrubPII } from "@eisbuk/shared";

export const __functionsZone__ = "europe-west6";
export const __projectId__ = process.env.PROJECT_ID;
export const __smsUrl__ = "https://gatewayapi.com/rest/mtsms";
export const __isEmulator__ = process.env.FUNCTIONS_EMULATOR === "true";

export const __sentryDSN__ = process.env.FUNCTIONS_SENTRY_DSN;
export const __sentryRelease__ = process.env.REACT_APP_SENTRY_RELEASE;

/** Request headers kept in Sentry events: none of them identify the caller */
const sentryRequestHeaders = [
  "content-type",
  "content-length",
  "user-agent",
  "origin",
  "host",
];

/**
 * The SDK sends request bodies as a JSON string, which 'scrubPII' can't look
 * into: parse it, scrub it and serialize it again.
 */
const scrubRequestData = (data: unknown): unknown => {
  if (typeof data !== "string") return scrubPII(data);
  try {
    return JSON.stringify(scrubPII(JSON.parse(data)));
  } catch {
    return "[Filtered]";
  }
};

/**
 * Strip athletes' personal data (callable request bodies, trigger context,
 * caller IP, ID tokens) before events leave the process. Default server-side
 * scrubbing only catches key names like 'password', so customer fields (name,
 * surname, birthday, email, phone - many belonging to minors) would otherwise
 * be persisted in the error tracker verbatim.
 */
const scrubSentryEvent = <E extends Event>(event: E): E => {
  if (event.request) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, headers, cookies, ...request } = event.request;
    event.request = scrubPII({
      ...request,
      ...(headers && {
        headers: Object.fromEntries(
          Object.entries(headers).filter(([key]) =>
            sentryRequestHeaders.includes(key.toLowerCase()),
          ),
        ),
      }),
      ...(data !== undefined && { data: scrubRequestData(data) }),
    });
  }
  if (event.user) event.user = scrubPII(event.user);
  if (event.extra) event.extra = scrubPII(event.extra);
  return event;
};

/**
 * Initialises Sentry when a DSN is configured (not in the emulators) and
 * returns whether error reporting is enabled. This runs when the functions are
 * loaded: if the initialisation throws (e.g. a malformed proxy setting), error
 * reporting is disabled, rather than preventing every function from loading.
 */
const initSentry = (): boolean => {
  if (process.env.FUNCTIONS_EMULATOR || !__sentryDSN__) return false;
  try {
    Sentry.init({
      dsn: __sentryDSN__,
      release: __sentryRelease__,
      tracesSampleRate: 1.0,
      beforeSend: scrubSentryEvent,
      // Transactions carry the same request data as error events
      beforeSendTransaction: scrubSentryEvent,
    });
    return true;
  } catch (err) {
    functions.logger.warn(
      "Sentry: initialisation failed, error reporting is disabled",
      err,
    );
    return false;
  }
};

export const __enableSentry__ = initSentry();

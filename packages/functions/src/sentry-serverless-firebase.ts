/* eslint-disable require-jsdoc */
/** Taken from
 * https://gist.githubusercontent.com/JFGHT/32cb01e9b3e842579dd2cc2741d2033e/raw/7ed0d2cffa3665410caee9b6e0e10be8e3cb0ef5/sentry-serverless-firebase.ts
 * ---
 * Temporary wrapper for firebase functions until @sentry/serverless support is implemented
 * It currently supports wrapping https, pubsub and firestore handlers.
 * usage: https.onRequest(wrap((req, res) => {...}))
 * Updated by JFGHT 29/12/2023
 * Taken from https://gist.github.com/zanona/0f3d42093eaa8ac5c33286cc7eca1166
 */
import type { Event, Scope, Transaction } from "@sentry/types";
import * as functions from "firebase-functions";
import type { https } from "firebase-functions";
import type { onRequest, onCall } from "firebase-functions/lib/providers/https";
import type { ScheduleBuilder } from "firebase-functions/lib/providers/pubsub";
import type { DocumentBuilder } from "firebase-functions/lib/providers/firestore";
import { __enableSentry__ } from "./constants";

type httpsOnRequestHandler = Parameters<typeof onRequest>[0];
type httpsOnCallHandler = Parameters<typeof onCall>[0];
type pubsubOnRunHandler = Parameters<ScheduleBuilder["onRun"]>[0];
type firestoreOnWriteHandler = Parameters<DocumentBuilder["onWrite"]>[0];
type firestoreOnUpdateHandler = Parameters<DocumentBuilder["onUpdate"]>[0];
type firestoreOnCreateHandler = Parameters<DocumentBuilder["onCreate"]>[0];
type firestoreOnDeleteHandler = Parameters<DocumentBuilder["onDelete"]>[0];

type FunctionType = "http" | "callable" | "document" | "schedule";

/** Maximum time a function waits for its events to be sent to Sentry */
const FLUSH_TIMEOUT_MS = 1000;

export function getLocationHeaders(req: https.Request): {
  country?: string;
  ip?: string;
} {
  /**
   * Checking order:
   * Cloudflare: in case user is proxying functions through it
   * Fastly: in case user is service functions through firebase hosting (Fastly is the default Firebase CDN)
   * App Engine: in case user is serving functions directly through cloudfunctions.net
   */
  const ip =
    req.header("Cf-Connecting-Ip") ||
    req.header("Fastly-Client-Ip") ||
    req.header("X-Appengine-User-Ip") ||
    req.header("X-Forwarded-For")?.split(",")[0] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;

  const country =
    req.header("Cf-Ipcountry") ||
    req.header("X-Country-Code") ||
    req.header("X-Appengine-Country");
  return { ip: ip?.toString(), country: country?.toString() };
}

function wrap<A, C>(
  type: FunctionType,
  name: string,
  fn: (a: A) => C | Promise<C>,
): typeof fn;
function wrap<A, B, C>(
  type: FunctionType,
  name: string,
  fn: (a: A, b: B) => C | Promise<C>,
): typeof fn;
function wrap<A, B, C>(
  type: FunctionType,
  name: string,
  fn: (a: A, b: B) => C | Promise<C>,
): typeof fn {
  // Don't wrap functions when running locally
  if (!__enableSentry__) {
    return fn;
  }

  return async (a: A, b: B): Promise<C> => {
    let sentry: typeof import("@sentry/node");
    try {
      sentry = await import("@sentry/node");
    } catch (err) {
      logReportingFailure(name, "loading the Sentry SDK", err);
      return fn(a, b);
    }

    // Each invocation runs in an async context of its own (a hub with a clone
    // of the current scope): the event processor and transaction added below
    // stay with this invocation, instead of piling up on a scope shared with
    // later invocations, or mixing with invocations running at the same time.
    let started = false;
    try {
      return await sentry.runWithAsyncContext(() => {
        started = true;
        return runWithSentry(
          sentry,
          sentry.getCurrentScope(),
          type,
          name,
          fn,
          a,
          b,
        );
      });
    } catch (err) {
      // 'runWithSentry' never throws synchronously and returns the function's
      // own outcome: only a failure before it started is Sentry's own
      if (started) throw err;
      logReportingFailure(name, "setting up error reporting", err);
      return fn(a, b);
    }
  };
}

/**
 * Runs the function, reporting its errors (and a performance transaction) to Sentry.
 *
 * Reporting must never change the outcome of the function: the function's own
 * result (or its own error) is returned as is, failures of the reporting itself
 * are only logged, and the time spent sending events is bounded.
 */
async function runWithSentry<A, B, C>(
  sentry: typeof import("@sentry/node"),
  scope: Scope,
  type: FunctionType,
  name: string,
  fn: (a: A, b: B) => C | Promise<C>,
  a: A,
  b: B,
): Promise<C> {
  const {
    startTransaction,
    captureException,
    flush,
    addRequestDataToEvent,
    extractTraceparentData,
  } = sentry;

  let transaction: Transaction | undefined;

  try {
    let req: https.Request | undefined;
    let ctx: Record<string, unknown> | undefined;
    if (type === "http") {
      req = a as unknown as https.Request;
    }
    if (type === "callable") {
      const ctxLocal = b as unknown as https.CallableContext;
      req = ctxLocal.rawRequest;
    }
    if (type === "document") {
      ctx = b as unknown as Record<string, unknown>;
    }
    if (type === "schedule") {
      ctx = a as unknown as Record<string, unknown>;
    }

    const traceparentData = extractTraceparentData(
      req?.header("sentry-trace") || "",
    );
    const tx = startTransaction({
      name,
      op: "transaction",
      ...traceparentData,
    });
    transaction = tx;

    scope.addEventProcessor((event): Event => {
      let ev: Event = event;

      if (req) {
        ev = addRequestDataToEvent(event, req);
        const loc = getLocationHeaders(req);
        if (loc.ip) {
          ev.user = { ...ev.user, ip_address: loc.ip };
        }
        if (loc.country) {
          ev.user = { ...ev.user, country: loc.country };
        }
      }
      if (ctx) {
        ev = addRequestDataToEvent(event, ctx);
        // The trigger's 'resource' is the full document path, which can contain
        // an athlete's secret key: only send the (scrubbed) params instead
        const { eventId, eventType, params } = ctx;
        ev.extra = { ...ev.extra, eventId, eventType, params };
        delete ev.request;
      }

      ev.transaction = tx.name;

      // force catpuring uncaughtError as not handled
      const mechanism = ev.exception?.values?.[0].mechanism;
      if (mechanism && ev.tags?.handled === false) {
        mechanism.handled = false;
      }
      return ev;
    });
    scope.setSpan(tx);
  } catch (err) {
    logReportingFailure(name, "setting up error reporting", err);
  }

  try {
    return await fn(a, b);
  } catch (err) {
    try {
      captureException(err, { tags: { handled: false } });
    } catch (reportingErr) {
      logReportingFailure(name, "capturing an exception", reportingErr);
    }
    // Always rethrow the function's own error (e.g. an 'HttpsError' meant for the client)
    throw err;
  } finally {
    try {
      transaction?.finish();
    } catch (err) {
      logReportingFailure(name, "finishing the transaction", err);
    }
    await flushWithTimeout(flush, name);
  }
}

/**
 * Waits (at most `FLUSH_TIMEOUT_MS`) for pending Sentry events to be sent.
 * Never rejects: the Sentry SDK's 'flush' rejects with the transport error
 * (e.g. ECONNREFUSED) when the Sentry server can't be reached (#944).
 */
async function flushWithTimeout(
  flush: (timeout?: number) => PromiseLike<boolean>,
  name: string,
): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), FLUSH_TIMEOUT_MS);
  });
  try {
    const flushed = await Promise.race([flush(FLUSH_TIMEOUT_MS), timeout]);
    if (!flushed) {
      functions.logger.warn(
        `Sentry: events for '${name}' not sent within ${FLUSH_TIMEOUT_MS}ms`,
      );
    }
  } catch (err) {
    logReportingFailure(name, "sending events", err);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Error reporting failures are logged (visible in Cloud Logging) but never
 * thrown: they mustn't affect the function being reported on.
 */
function logReportingFailure(name: string, step: string, err: unknown) {
  functions.logger.warn(`Sentry: failed ${step} for '${name}'`, err);
}

export function wrapHttpsOnRequestHandler(
  name: string,
  fn: httpsOnRequestHandler,
): typeof fn {
  return wrap("http", name, fn);
}

export function wrapHttpsOnCallHandler(
  name: string,
  fn: httpsOnCallHandler,
): typeof fn {
  return wrap("callable", name, fn);
}

export function wrapPubsubOnRunHandler(
  name: string,
  fn: pubsubOnRunHandler,
): typeof fn {
  return wrap("schedule", name, fn);
}

export function wrapFirestoreOnWriteHandler(
  name: string,
  fn: firestoreOnWriteHandler,
): typeof fn {
  return wrap("document", name, fn);
}

export function wrapFirestoreOnUpdateHandler(
  name: string,
  fn: firestoreOnUpdateHandler,
): typeof fn {
  return wrap("document", name, fn);
}

export function wrapFirestoreOnCreateHandler(
  name: string,
  fn: firestoreOnCreateHandler,
): typeof fn {
  return wrap("document", name, fn);
}

export function wrapFirestoreOnDeleteHandler(
  name: string,
  fn: firestoreOnDeleteHandler,
): typeof fn {
  return wrap("document", name, fn);
}

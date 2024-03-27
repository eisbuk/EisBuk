import * as functions from "firebase-functions";

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
import type { Event } from "@sentry/types";
import type { https } from "firebase-functions";
import type { onRequest, onCall } from "firebase-functions/lib/providers/https";
import type { ScheduleBuilder } from "firebase-functions/lib/providers/pubsub";
import type { DocumentBuilder } from "firebase-functions/lib/providers/firestore";
import {
  __enableSentry__,
  __sentryDSN__,
  __sentryRelease__,
} from "./constants";

type httpsOnRequestHandler = Parameters<typeof onRequest>[0];
type httpsOnCallHandler = Parameters<typeof onCall>[0];
type pubsubOnRunHandler = Parameters<ScheduleBuilder["onRun"]>[0];
type firestoreOnWriteHandler = Parameters<DocumentBuilder["onWrite"]>[0];
type firestoreOnUpdateHandler = Parameters<DocumentBuilder["onUpdate"]>[0];
type firestoreOnCreateHandler = Parameters<DocumentBuilder["onCreate"]>[0];
type firestoreOnDeleteHandler = Parameters<DocumentBuilder["onDelete"]>[0];

type FunctionType = "http" | "callable" | "document" | "schedule";

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
  fn: (a: A) => C | Promise<C>
): typeof fn;
function wrap<A, B, C>(
  type: FunctionType,
  name: string,
  fn: (a: A, b: B) => C | Promise<C>
): typeof fn;
function wrap<A, B, C>(
  type: FunctionType,
  name: string,
  fn: (a: A, b: B) => C | Promise<C>
): typeof fn {
  // Don't wrap functions when running locally
  if (!__enableSentry__) {
    return fn;
  }

  return async (a: A, b: B): Promise<C> => {
    functions.logger.info("Sentry wrapping function");
    const {
      startTransaction,
      captureException,
      flush,
      addRequestDataToEvent,
      getCurrentScope,
      extractTraceparentData,
    } = await import("@sentry/node");

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
      req?.header("sentry-trace") || ""
    );
    const transaction = startTransaction({
      name,
      op: "transaction",
      ...traceparentData,
    });

    const scope = getCurrentScope();

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
        ev.extra = ctx;
        delete ev.request;
      }

      ev.transaction = transaction.name;

      // force catpuring uncaughtError as not handled
      const mechanism = ev.exception?.values?.[0].mechanism;
      if (mechanism && ev.tags?.handled === false) {
        mechanism.handled = false;
      }
      return ev;
    });
    scope.setSpan(transaction);

    functions.logger.info("Sentry set up, starting transaction");
    functions.logger.log({ __sentryDSN__, __sentryRelease__ });

    try {
      const result = fn(a, b);
      functions.logger.info("Executing function...");
      // @ts-expect-error - I'm sorry, I lifted this code and I don't know how to fix this typing error
      return (
        Promise.resolve(result)
          .catch((err): void => {
            captureException(err, { tags: { handled: false } });
            throw err;
          })
          // eslint-disable-next-line promise/no-return-in-finally
          .finally(async (): Promise<boolean> => {
            functions.logger.log("Fuction executed, finishing transaction");
            transaction.finish();
            functions.logger.log("Transaction finished, flushing");
            // If we threw an error here (it will be caught by sentry's error handling wrapper)
            const res = await flush(2000);
            functions.logger.log("Flushed transaction, res");
            functions.logger.log({ res });
            return res;
          }) as Promise<C | undefined>
      );
    } catch (err) {
      functions.logger.error(err);
      captureException(err, { tags: { handled: false } });
      functions.logger.info("Captured exception, finishing transaction");
      transaction.finish();
      functions.logger.log("Transaction finished, flushing");
      // If we threw an error here, nothing would be sent to Sentry (web-sink at localhost:3001 in this case)
      const res = await flush(2000);
      functions.logger.log("Flushed transaction, res", { res });
      throw err;
    }
  };
}

export function wrapHttpsOnRequestHandler(
  name: string,
  fn: httpsOnRequestHandler
): typeof fn {
  return wrap("http", name, fn);
}

export function wrapHttpsOnCallHandler(
  name: string,
  fn: httpsOnCallHandler
): typeof fn {
  return wrap("callable", name, fn);
}

export function wrapPubsubOnRunHandler(
  name: string,
  fn: pubsubOnRunHandler
): typeof fn {
  return wrap("schedule", name, fn);
}

export function wrapFirestoreOnWriteHandler(
  name: string,
  fn: firestoreOnWriteHandler
): typeof fn {
  return wrap("document", name, fn);
}

export function wrapFirestoreOnUpdateHandler(
  name: string,
  fn: firestoreOnUpdateHandler
): typeof fn {
  return wrap("document", name, fn);
}

export function wrapFirestoreOnCreateHandler(
  name: string,
  fn: firestoreOnCreateHandler
): typeof fn {
  return wrap("document", name, fn);
}

export function wrapFirestoreOnDeleteHandler(
  name: string,
  fn: firestoreOnDeleteHandler
): typeof fn {
  return wrap("document", name, fn);
}

import * as Sentry from "@sentry/serverless";
import functions from "firebase-functions";

export const __functionsZone__ = "europe-west6";
export const __projectId__ = process.env.PROJECT_ID;
export const __smsUrl__ = "https://gatewayapi.com/rest/mtsms";
export const __isEmulator__ = process.env.FUNCTIONS_EMULATOR === "true";

// Sentry dsn is set up to send all logs to the web-sink for easier inspection
export const __sentryDSN__ = "http://admin:password@127.0.0.1:3001/1234567"; // process.env.FUNCTIONS_SENTRY_DSN;
export const __sentryRelease__ = "test-release"; // process.env.REACT_APP_SENTRY_RELEASE;
export const __enableSentry__ = true;
// !process.env.FUNCTIONS_EMULATOR && Boolean(__sentryDSN__);

// (globally) Override console.log to reroute logs to Firebase Functions logger
// In functions we already us the functons logger, but for 3rd party libs (such as Sentry client), with debug on,
// we need to reroute console.log to functions.logger.log (else they won't be displayed anywhere)
console.log = functions.logger.log;
console.info = functions.logger.info;
console.error = functions.logger.error;

if (__enableSentry__) {
  Sentry.init({
    dsn: __sentryDSN__,
    release: __sentryRelease__,
    tracesSampleRate: 1.0,
    debug: true,
  });
}

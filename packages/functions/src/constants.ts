import * as Sentry from "@sentry/serverless";

export const __functionsZone__ = "europe-west6";
export const __projectId__ = process.env.PROJECT_ID;
export const __smsUrl__ = "https://gatewayapi.com/rest/mtsms";
export const __sentryDSN__ = process.env.FUNCTIONS_SENTRY_DSN;
export const __enableSentry__ =
  !process.env.FUNCTIONS_EMULATOR && Boolean(__sentryDSN__);

if (__enableSentry__) {
  Sentry.init({
    dsn: __sentryDSN__,
    tracesSampleRate: 1.0,
  });
}

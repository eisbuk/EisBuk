import * as Sentry from "@sentry/serverless";

export const __functionsZone__ = "europe-west6";
export const __projectId__ = process.env.PROJECT_ID;
export const __smsUrl__ = "https://gatewayapi.com/rest/mtsms";
export const __sentryDSN__ = process.env.REACT_APP_SENTRY_DSN;

if (!process.env.FUNCTIONS_EMULATOR) {
  Sentry.init({
    dsn: __sentryDSN__,
    tracesSampleRate: 1.0,
  });
}

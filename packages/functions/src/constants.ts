import * as Sentry from "@sentry/serverless";

import { scrubPII } from "@eisbuk/shared";

export const __functionsZone__ = "europe-west6";
export const __projectId__ = process.env.PROJECT_ID;
export const __smsUrl__ = "https://gatewayapi.com/rest/mtsms";
export const __isEmulator__ = process.env.FUNCTIONS_EMULATOR === "true";

export const __sentryDSN__ = process.env.FUNCTIONS_SENTRY_DSN;
export const __sentryRelease__ = process.env.REACT_APP_SENTRY_RELEASE;
export const __enableSentry__ =
  !process.env.FUNCTIONS_EMULATOR && Boolean(__sentryDSN__);

if (__enableSentry__) {
  Sentry.init({
    dsn: __sentryDSN__,
    release: __sentryRelease__,
    tracesSampleRate: 1.0,
    // Strip athletes' personal data (callable request bodies, trigger context,
    // caller IP) before events leave the process. Default server-side scrubbing
    // only catches key names like 'password', so customer fields (name,
    // surname, birthday, email, phone - many belonging to minors) would
    // otherwise be persisted in the error tracker verbatim.
    beforeSend: (event) => {
      if (event.request) event.request = scrubPII(event.request);
      if (event.user) event.user = scrubPII(event.user);
      if (event.extra) event.extra = scrubPII(event.extra);
      return event;
    },
  });
}

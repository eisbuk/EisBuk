import React from "react";
import ReactDOM from "react-dom";

import "./i18next/i18n";

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import {
  __sentryDSN__,
  __sentryEnvironment__,
  __sentryRelease__,
} from "@/lib/constants";

import App from "@/App";

if (__sentryDSN__) {
  // init crashlytics only if dsn provided
  Sentry.init({
    environment: __sentryEnvironment__,
    dsn: __sentryDSN__,
    release: __sentryRelease__,
    integrations: [
      new Integrations.BrowserTracing({
        beforeNavigate: (context) => {
          return {
            ...context,
            name: location.pathname
              .replace(
                /\/[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}/g,
                "/<secret-key>"
              )
              .replace(/\/[a-f0-9]{32}/g, "/<hash>")
              .replace(/\/\d+/g, "/<digits>"),
          };
        },
      }),
    ],
    tracesSampleRate: 1.0,
  });
  console.log("Sentry initialized");
}

ReactDOM.render(<App />, document.getElementById("root"));

import React from "react";
import ReactDOM from "react-dom";

import "./i18next/i18n";

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import { __sentryDSN__ } from "@/lib/constants";

import App from "@/App";

if (__sentryDSN__) {
  // init crashlytics only if dsn provided
  Sentry.init({
    dsn: __sentryDSN__,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
  });
  console.log("Sentry initialized");
}

ReactDOM.render(<App />, document.getElementById("root"));

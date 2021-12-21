import React from "react";
import ReactDOM from "react-dom";

import "./i18next/i18n";

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import { __isProduction__ } from "@/lib/constants";

import App from "@/App";

if (__isProduction__) {
  // init crashlytics only for production
  Sentry.init({
    dsn: "https://d1a59edc9bd2488ab6a0bbb48df59458@o1096484.ingest.sentry.io/6117136",
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
  });
}

ReactDOM.render(<App />, document.getElementById("root"));

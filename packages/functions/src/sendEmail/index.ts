import { __isEmulator__ } from "../constants";

import {
  deliverEmail as deliver,
  deliverEmailTesting as fallback,
} from "./deliver";

export * from "./https";

// When running inside firebase emulators, we're disabling the delivery data trigger as:
// - we can't get the full functionality from localhost anyhow (SSL, confirmation web hooks, etc.)
// - makes testing in CI somewhat flaky
export const deliverEmail = __isEmulator__ ? fallback : deliver;

import { DateTime } from "luxon";

import { __storybookDate__ } from "@/lib/constants";

import { luxonToFB } from "@/utils/date";

/**
 * ISO date we're using across all tests
 */
export const testDate = __storybookDate__;
/**
 * Test date in milliseconds (placeholder until @TODO we've solve the issue with Timestamp)
 */
export const timestampDate = {
  seconds: luxonToFB(DateTime.fromISO(__storybookDate__)).seconds,
};

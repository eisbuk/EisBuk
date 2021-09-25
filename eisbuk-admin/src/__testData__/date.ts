import { Timestamp } from "@google-cloud/firestore";
import { DateTime } from "luxon";

import { __storybookDate__ } from "@/lib/constants";

/**
 * ISO date we're using across all tests
 */
export const testDate = __storybookDate__;
/**
 * DateTime representation of our test data
 */
export const testDateLuxon = DateTime.fromISO(__storybookDate__);
/**
 * Test date in milliseconds (placeholder until @TODO we've solve the issue with Timestamp)
 */
export const timestampDate: Timestamp = {
  seconds: testDateLuxon.toSeconds(),
} as Timestamp;

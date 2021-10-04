import { DateTime } from "luxon";

import { __storybookDate__ } from "@/lib/constants";

import { luxonToFB } from "@/utils/date";

/**
 * ISO date we're using across all tests
 */
export const testDate = __storybookDate__;
/**
 * DateTime representation of our test data
 */
export const testDateLuxon = DateTime.fromISO(__storybookDate__);
/**
 * Test date in firestore Timestamp format
 */
export const timestampDate = luxonToFB(testDateLuxon);

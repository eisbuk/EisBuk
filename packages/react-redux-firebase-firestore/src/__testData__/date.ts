import { DateTime } from "luxon";

const __storybookDate__ = "2021-03-01";

/**
 * ISO date we're using across all tests
 */
export const testDate = __storybookDate__;
/**
 * DateTime representation of our test data
 */
export const testDateLuxon = DateTime.fromISO(__storybookDate__);

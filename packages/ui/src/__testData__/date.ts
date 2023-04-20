/** @DUPLICATE_FILE @eisbuk/client/src/__testData__/date.ts */
import { DateTime } from "luxon";

/**
 * ISO date we're using across all tests
 */
export const testDate = "2022-01-01";
/**
 * DateTime representation of our test data
 */
export const testDateLuxon = DateTime.fromISO(testDate);

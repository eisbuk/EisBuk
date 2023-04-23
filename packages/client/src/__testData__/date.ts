/** @DUPLICATE_FILE @eisbuk/ui/src/__testData__/date.ts */
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

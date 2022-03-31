import i18n from "i18next";
import { DateTime, DateTimeUnit } from "luxon";
declare type TranslateFunc = typeof i18n.t;
/**
 * Creates a title from start time and timeframe lenght.
 * @param startDate start date of current timeframe
 * @param timespan timeframe length
 * @param t an optional translate function we're using for dependency injection in tests,
 * falls back to `i18n.t`
 * @returns string to be used as title of the component
 */
export declare const createDateTitle: (startDate: DateTime, timespan: DateTimeUnit, t?: TranslateFunc) => string;
export {};

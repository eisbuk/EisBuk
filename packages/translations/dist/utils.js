"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDateTitle = void 0;
const i18next_1 = __importDefault(require("i18next"));
const translations_1 = require("./translations");
/**
 * Creates a title from start time and timeframe lenght.
 * @param startDate start date of current timeframe
 * @param timespan timeframe length
 * @param t an optional translate function we're using for dependency injection in tests,
 * falls back to `i18n.t`
 * @returns string to be used as title of the component
 */
const createDateTitle = (startDate, timespan, t = i18next_1.default.t) => {
    switch (timespan) {
        // for monthly view we're using the full month string
        case "month":
            return t(translations_1.DateFormat.MonthYear, {
                date: startDate,
            });
        // for day view we're using the specialized day string format
        case "day":
            return t(translations_1.DateFormat.Full, { date: startDate });
        // for week and other views we're using standardized format: showing first and last date within the timeframe
        default:
            const startDateString = t(translations_1.DateFormat.DayMonth, {
                date: startDate.startOf(timespan),
            });
            const endDateString = t(translations_1.DateFormat.DayMonth, {
                date: startDate.endOf(timespan).startOf("day"),
            });
            return [startDateString, endDateString].join(" - ");
    }
};
exports.createDateTitle = createDateTitle;
//# sourceMappingURL=utils.js.map
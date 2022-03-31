"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.luxon2ISODate = exports.fromISO = void 0;
const luxon_1 = require("luxon");
/**
 * Convert ISO Date string to luxon string (DateTime)
 * @param isoStr
 * @returns
 */
const fromISO = (isoStr) => luxon_1.DateTime.fromISO(isoStr);
exports.fromISO = fromISO;
/**
 * Converts the luxon DateTime to ISO date string format with only the day part (excluding time of day)
 * @param luxonDate to convert
 * @returns ISO `yyyy-mm-dd` string
 */
const luxon2ISODate = (luxonDate) => luxonDate.toISO().substr(0, 10);
exports.luxon2ISODate = luxon2ISODate;
//# sourceMappingURL=date.js.map
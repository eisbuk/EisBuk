"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerBase = void 0;
/**
 * A helper function used to strip excess customer data
 * and create customer base data (used as `bookings` data for customer)
 * @param customer customer entry (without `secretKey` for convenient testing)
 * @returns customer base structure
 */
const getCustomerBase = ({ id, name, surname, category, extendedDate, deleted, }) => ({
    id,
    name,
    surname,
    category,
    // add extended date only if it exists, rather than saving `extendedDate: undefined`
    ...(extendedDate ? { extendedDate } : {}),
    deleted: Boolean(deleted),
});
exports.getCustomerBase = getCustomerBase;
//# sourceMappingURL=customers.js.map
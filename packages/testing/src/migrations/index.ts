import { sanitizeCustomer } from "@eisbuk/shared";

import { baseSlot } from "../slots";
import { gus, walt } from "../customers";

// #region customerMigrations
const { secretKey: gusSecretKey, ...gusData } = gus;

const { secretKey: waltSecretKey, ...waltData } = walt;

/**
 * Record of old customers (containing `secret_key`) keyed by id
 */
export const oldCustomers = {
  walt: { ...waltData, secret_key: waltSecretKey },
  gus: { ...gusData, secret_key: gusSecretKey },
};
/**
 * Record of new customers (containing `secretKey`) keyed by id
 */
export const migratedCustomers = { walt, gus };
// #endregion customerMigrations

// #region slotMigrations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { id: _unusedId, intervals, ...coreSlot } = baseSlot;

// #region bookingsMigrations
const { id: gusId, ...gusBase } = sanitizeCustomer(gus);
const { id: waltId, ...waltBase } = sanitizeCustomer(walt);
/**
 * Test customers in "old" `BookingsMeta` structure
 */
export const oldCustomerBase = {
  gus: { ...gusBase, customer_id: gusId },
  walt: { ...waltBase, customer_id: waltId },
};
/**
 * Test customers in "new" `CustomerBase` structure
 */
export const newCustomerBase = {
  gus: { ...gusBase, id: gusId },
  walt: { ...waltBase, id: waltId },
};

/**
 * Deprecated `data` collection of customer's `bookings` entry.
 * Should get deleted within tests. The structure of each bookingEntry doesn't
 * correspond to the old struct entirely, but it makes no difference for this purpose
 */
export const testBookingData = {
  ["slot-0"]: { duration: "120" },
  ["slot-1"]: { duration: "60" },
};
// #endregion bookingsMigrations

// #region bookingsByDayMigrations
export const testBookingsByDay = {
  ["slot-0"]: {
    ["customer-0"]: "120",
  },
  ["slot-1"]: {
    ["customer-0"]: "120",
    ["customer-1"]: "60",
  },
};
// #endregion bookingsByDayMigrations

// #region slotsByDay
/**
 * Month string we'll be using to test pruning
 */
export const pruningMonthString = "2020-03";
/**
 * Month string for empty month in tests
 */
export const emptyMonthString = "2020-04";
/**
 * Pruned month. We're expecting this as a result of pruning the `unprunedMonth`
 */
export const prunedMonth = {
  ["2020-03-02"]: {
    ["slot-0"]: { ...baseSlot, intervals },
  },
};
/**
 * Month we're passing as input to pruning migration, should get empty days filtered out
 */
export const unprunedMonth = {
  ...prunedMonth,
  ["2020-03-01"]: {},
  ["2020-03-05"]: {},
};
/**
 * Empty month we're using for tests, should get deleted
 */
export const emptyMonth = {
  ["2020-04-01"]: {},
  ["2020-04-05"]: {},
  ["2020-04-10"]: {},
};

// #endregion slotsByDay

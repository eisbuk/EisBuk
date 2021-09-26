import { DeprecatedDuration } from "eisbuk-shared/dist/deprecated";

import { baseSlot } from "./dummyData";
import { gus, walt } from "./customers";

// #region customerMigrations
const { secretKey: gusSecretKey, ...gusBase } = gus;
export const gusOld = { ...gusBase, secret_key: gusSecretKey };

const { secretKey: waltSecretKey, ...waltBase } = walt;
export const waltOld = { ...waltBase, secret_key: waltSecretKey };
// #endregion customerMigrations

// #region slotMigrations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { intervals, ...coreSlot } = baseSlot;

// old interval structures (should get deleted in migration test)
const oldSlot1 = { ...coreSlot, durations: [DeprecatedDuration["1.5h"]] };
const oldSlot2 = { ...coreSlot, durations: [DeprecatedDuration["1.5h"]] };

/**
 * New and old slots, used to test old slots getting filtered out
 * and new slots not being touched
 */
export const mixedSlots = {
  ["old-slot-0"]: { ...oldSlot1, id: "old-slot-0" },
  ["old-slot-1"]: { ...oldSlot2, id: "old-slot-1" },
  ["new-slot-0"]: { ...baseSlot, id: "new-slot-0" },
};
// #endregion slotMigrations

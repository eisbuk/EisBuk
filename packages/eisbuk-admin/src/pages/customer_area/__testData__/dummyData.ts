import { baseSlot } from "@/__testData__/slots";

import { SlotType } from "eisbuk-shared";

import { CustomerRoute } from "@/enums/routes";

// #region CustomerRoute
/**
 * Slot structure received from store
 */
export const dummySlotsFromStore = {
  "2021-03-01": {
    ["slot-0"]: { ...baseSlot, id: "slot-0", type: SlotType.Ice },
    ["slot-1"]: { ...baseSlot, id: "slot-1", type: SlotType.OffIce },
    ["slot-2"]: { ...baseSlot, id: "slot-2", type: SlotType.OffIce },
  },
  "2021-03-02": {
    ["slot-3"]: { ...baseSlot, id: "slot-3", type: SlotType.Ice },
    ["slot-4"]: { ...baseSlot, id: "slot-4", type: SlotType.OffIce },
    ["slot-5"]: { ...baseSlot, id: "slot-5", type: SlotType.OffIce },
  },
  "2021-03-03": {
    ["slot-4"]: { ...baseSlot, id: "slot-4", type: SlotType.OffIce },
    ["slot-5"]: { ...baseSlot, id: "slot-5", type: SlotType.OffIce },
  },
  // book_ice should filter those, while book_off_ice should keep them
  "2021-03-04": {},
  "2021-03-05": {},
  "2021-03-06": {},
  "2021-03-07": {},
};

/**
 * The result we're expecting from `splitSlotsByCustomerRoute(baseSlotsFromStore)`
 */
export const dummySlotsSplitByRoute = {
  [CustomerRoute.BookIce]: {
    "2021-03-01": {
      ["slot-0"]: { ...baseSlot, id: "slot-0", type: SlotType.Ice },
    },
    "2021-03-02": {
      ["slot-3"]: { ...baseSlot, id: "slot-3", type: SlotType.Ice },
    },
  },
  [CustomerRoute.BookOffIce]: {
    "2021-03-01": {
      ["slot-1"]: { ...baseSlot, id: "slot-1", type: SlotType.OffIce },
      ["slot-2"]: { ...baseSlot, id: "slot-2", type: SlotType.OffIce },
    },
    "2021-03-02": {
      ["slot-4"]: { ...baseSlot, id: "slot-4", type: SlotType.OffIce },
      ["slot-5"]: { ...baseSlot, id: "slot-5", type: SlotType.OffIce },
    },
    "2021-03-03": {
      ["slot-4"]: { ...baseSlot, id: "slot-4", type: SlotType.OffIce },
      ["slot-5"]: { ...baseSlot, id: "slot-5", type: SlotType.OffIce },
    },
  },
  [CustomerRoute.Calendar]: {
    ["slot-0"]: { ...baseSlot, id: "slot-0", type: SlotType.Ice },
    ["slot-1"]: { ...baseSlot, id: "slot-1", type: SlotType.OffIce },
    ["slot-2"]: { ...baseSlot, id: "slot-2", type: SlotType.OffIce },
    ["slot-3"]: { ...baseSlot, id: "slot-3", type: SlotType.Ice },
    ["slot-4"]: { ...baseSlot, id: "slot-4", type: SlotType.OffIce },
    ["slot-5"]: { ...baseSlot, id: "slot-5", type: SlotType.OffIce },
  },
};
// #region CustomerRoute

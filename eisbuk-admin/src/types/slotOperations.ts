import { Timestamp } from "@google-cloud/firestore";

import { SlotType, Category, Duration, Slot } from "eisbuk-shared";

/**
 * Params shared between different types of operation on slot ("create" | "edit")
 */
export interface SlotOperationBaseParams {
  type: SlotType;
  categories: Category[];
  durations: Duration[];
  notes: string;
}

/**
 * Params for operation on slot ("create" | "edit") and other
 */
type SlotOperationParams<
  T extends "create" | "edit" | "other" = "other"
> = T extends "other"
  ? Slot<"id">
  : T extends "create"
  ? {
      date: Timestamp;
    } & SlotOperationBaseParams
  : {
      id: string;
    } & SlotOperationBaseParams;

/**
 * An umbrella type for createSlot and editSlot
 */
export interface SlotOperation<
  T extends "create" | "edit" | "other" = "other"
> {
  (params: SlotOperationParams<T>): void;
}

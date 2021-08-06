import { Timestamp } from "@google-cloud/firestore";

import { SlotType, Category, Duration, BookingInfo } from "eisbuk-shared";

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
 * Params for operation on slot ("create" | "subecribe" | "other")
 */
type SlotOperationParams<
  T extends "create" | "subscribe" | "other" = "other"
> = T extends "subscribe"
  ? BookingInfo
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
  T extends "create" | "subscribe" | "other" = "other"
> {
  (params: SlotOperationParams<T>): void;
}

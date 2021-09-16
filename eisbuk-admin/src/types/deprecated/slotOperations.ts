import { Timestamp } from "@google-cloud/firestore";

import { SlotType, Category } from "eisbuk-shared";
import { DeprecatedDuration } from "eisbuk-shared/dist/enums/deprecated/firestore";
import { DeprecatedBookingInfo } from "eisbuk-shared/dist/types/deprecated/firestore";

/**
 * Params shared between different types of operation on slot ("create" | "edit")
 */
export interface SlotOperationBaseParams {
  type: SlotType;
  categories: Category[];
  durations: DeprecatedDuration[];
  notes: string;
}

/**
 * Params for operation on slot ("create" | "subecribe" | "other")
 */
type SlotOperationParams<
  T extends "create" | "subscribe" | "other" = "other"
> = T extends "subscribe"
  ? DeprecatedBookingInfo
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

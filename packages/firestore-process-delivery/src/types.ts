import * as functions from "firebase-functions";

// #region typeAliases
export type DocumentReference =
  FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
export type Change = functions.Change<FirebaseFirestore.DocumentSnapshot>;
export type Timestamp = FirebaseFirestore.Timestamp;
export type FieldValue = FirebaseFirestore.FieldValue;
// #endregion typeAliases

// #region process
/**
 * Status of the process delivery
 */
export enum DeliveryStatus {
  /**
   * The final success state, execution stops, delivery was successful
   */
  Success = "SUCCESS",
  /**
   * The final error state, execution stops, delivery failed, error should be shown
   */
  Error = "ERROR",
  /**
   * The operation is being processed (`runTransaction` is trying to complete the delivery)
   */
  Processing = "PROCESSING",
  /**
   * The operation has been enqueued, and is waiting for delivery execution
   */
  Pending = "PENDING",
  /**
   * Retry state never happens automatically, but can be triggered manually on
   * "ERROR" status deliveries (by writing directly to the delivery state document)
   */
  Retry = "RETRY",
}

/**
 * Interface of a process document. The `delivery` part contains
 * the delivery state data and is updated by processDelivery functionality.
 * The document will probably be filled with other data used for a particular delivery functionality.
 */
export interface ProcessDocument {
  [key: string]: any;
  delivery: {
    startTime: Timestamp;
    endTime?: Timestamp;
    leaseExpireTime: Timestamp | null;
    status: DeliveryStatus;
    attempts: number;
    error: string | null;
    result: any;
  };
}

type TimestampKeys = "startTime" | "endTime" | "leaseExpireTime";

/**
 * An update for `ProcessDocument`'s `delivery` state. Each field is optional due to update being applied
 * using `merge:true`. Additionally, each timestamped field ("startTime", "endTime", "leaseExpiration") can also
 * be `FieldValue` other than `Timestamp | null` as it's an update - resulting in an appropriate
 * `Timestamp | null` value in the state itself
 */
export type DeliveryUpdate = Partial<
  Omit<ProcessDocument["delivery"], TimestampKeys> &
    Record<TimestampKeys, Timestamp | FieldValue | null>
>;
// #endregion process

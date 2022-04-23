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
 * The payload is any payload appropriate for a particular delivery functionality (i.e. email sending)
 */
export interface ProcessDocument {
  delivery: {
    startTime: Timestamp;
    endTime?: Timestamp | null;
    leaseExpireTime: Timestamp | null;
    state: DeliveryStatus;
    attempts: number;
    error: string | null;
    result: any;
  };
  payload: Record<string, any>;
}

/**
 * An update object passed to `transaction.update` in order to update
 * the delivery status of a  process document.
 */
export type ProcessUpdate = Partial<{
  "delivery.startTime": FieldValue;
  "delivery.endTime": FieldValue;
  "delivery.leaseExpireTime": Timestamp | null;
  "delivery.state": DeliveryStatus;
  "delivery.attempts": number;
  "delivery.error": string | null;
  "delivery.result": any;
}>;
// #endregion process

import * as functions from "firebase-functions";

// #region typeAliases
export type DocumentReference =
  FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
export type Change = functions.Change<FirebaseFirestore.DocumentSnapshot>;
export type Timestamp = FirebaseFirestore.Timestamp;
export type FieldValue = FirebaseFirestore.FieldValue;
// #endregion typeAliases

// #region processDocument
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
 * the delivery state data and is updated by `processDelivery` functionality.
 *
 * The `payload` property should house the payload sent to the deliver function (eg. email data for email sending functionality).
 */
export interface ProcessDocument<P = Record<string, any>> {
  delivery: {
    /**
     * Start time of the delivery process.
     */
    startTime: Timestamp;
    /**
     * Time of the latest update (`"SUCCESS"`, `"ERROR"`, or additional updates from provider webhooks).
     */
    endTime?: Timestamp;
    /**
     * Lease expires 60 seconds after the delivery attempted (assigned on `"PENDING"` or `"RETRY"`).
     */
    leaseExpireTime: Timestamp | null;
    /**
     * See `DeliveryStatus` enum.
     */
    status: DeliveryStatus;
    /**
     * Number of delivery attempts: incremented on each PENDING or RETRY before starting the delivery attempt.
     */
    attempts: number;
    /**
     * An array of error messages.
     */
    errors: string[] | null;
    /**
     * Response object of successful delivery
     */
    result: Record<string, any> | null;
    /**
     * Optional metadata of a delivery process
     */
    meta?: Record<string, any> | null;
  };
  payload: P;
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
// #endregion processDocument

// #region deliverCallback
/**
 * A three part tuple usad across delivery and functions related JSON validations:
 * `[<resultObject>, <errorsArray>, <metadataObject>]`
 * - either the `errorsArray` is `null` and `resultObject` is defined = SUCCESS
 * - or `resultObject` is `null` and `errorsArray` contains at least one error message = FAILURE
 * - `metadataObject` is always an object, empty or otherwise
 */
export type DeliverResultTuple<
  S extends DeliveryStatus.Error | DeliveryStatus.Success = any,
  R extends Record<string, any> = Record<string, any>
> = S extends DeliveryStatus.Success
  ? [R, null, Record<string, any>]
  : [null, string[], Record<string, any>];

interface SuccessHelper {
  (
    res: Record<string, any>,
    meta?: Record<string, any>
  ): DeliverResultTuple<DeliveryStatus.Success>;
}
interface ErrorHelper {
  (
    errors: string[],
    meta?: Record<string, any>
  ): DeliverResultTuple<DeliveryStatus.Error>;
}

/**
 * Deliver function (used to attempt the delivery, eg. send email), should adhere to
 * this type so that the rest of the `processDelivery` can record state and process further.
 */
export interface DeliverCallback {
  (helpers: {
    /**
     * On successful delivery, return the result of this helper, like so:
     * ```
     * const res = await someAsyncFunc()
     * return success(res)
     * ```
     */
    success: SuccessHelper;
    /**
     * On failed delivery, return the result of this helper, like so:
     * ```
     * ajv.validate(SomeSchema, someJSON)
     * if (ajv.errors.length) {
     *  return error(ajv.errors)
     * }
     * ```
     */
    error: ErrorHelper;
  }): Promise<DeliverResultTuple>;
}
// #endregion deliverCallback

import admin from "firebase-admin";
import functions from "firebase-functions";

type DocumentReference =
  FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;

type Change = functions.Change<FirebaseFirestore.DocumentSnapshot>;

type Timestamp = FirebaseFirestore.Timestamp;

type FieldValue = FirebaseFirestore.FieldValue;

/**
 * Status of the process delivery
 */
enum DeliveryStatus {
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

interface ProcessDocument {
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

type ProcessUpdate = Partial<{
  "delivery.startTime": FieldValue;
  "delivery.endTime": FieldValue;
  "delivery.leaseExpireTime": Timestamp | null;
  "delivery.state": DeliveryStatus;
  "delivery.attempts": number;
  "delivery.error": string | null;
  "delivery.result": any;
}>;

const execute = async (
  deliver: () => Promise<any>,
  processDocumentRef: DocumentReference
) => {
  const update: ProcessUpdate = {};

  try {
    update["delivery.result"] = await deliver();
    update["delivery.state"] = DeliveryStatus.Success;
  } catch (e) {
    update["delivery.status"] = DeliveryStatus.Error;
    update["delivery.error"] = (e as any).toString();
  }

  // Write the delivery result to the queue using transaction to enable
  // automatic retries
  admin.firestore().runTransaction((t) => {
    t.update(processDocumentRef, update);
    return Promise.resolve();
  });
};

const initialDeliveryState: Required<Omit<ProcessUpdate, "delivery.endTime">> =
  {
    "delivery.startTime": admin.firestore.FieldValue.serverTimestamp(),
    "delivery.leaseExpireTime": null,
    "delivery.state": DeliveryStatus.Pending,
    "delivery.attempts": 0,
    "delivery.error": null,
    "delivery.result": null,
  };

const processCreate = (ref: FirebaseFirestore.DocumentReference) =>
  // Wrapping in transaction to allow for automatic retries (#48)
  admin.firestore().runTransaction((transaction) => {
    transaction.update(ref, {
      delivery: initialDeliveryState,
    });
    return Promise.resolve();
  });

const processDelivery = async (
  change: Change,
  deliver: () => Promise<any>
): Promise<void> => {
  // Exit early on delete
  if (!change.after.exists) {
    return;
  }

  // Start new delivery process
  if (!change.before.exists) {
    processCreate(change.after.ref);
    return;
  }

  const processDocument = change.after.data() as ProcessDocument;

  const { delivery } = processDocument;
  const { leaseExpireTime } = delivery;

  const update: ProcessUpdate = {};

  switch (delivery.state) {
    case DeliveryStatus.Success:
    case DeliveryStatus.Error:
      return;

    // Honestly, the scenario of this part bringing any utility whatsoever seems extremely (astronomically) unlikely
    // As it's a copy/edit of an existing Firebase official extension, leaving this here...might update at some point
    case DeliveryStatus.Processing:
      if (!leaseExpireTime || leaseExpireTime.toMillis() < Date.now()) {
        update["delivery.state"] = DeliveryStatus.Error;
        update["delivery.error"] = "Message processing lease expired.";

        admin.firestore().runTransaction((transaction) => {
          transaction.update(change.after.ref, update);
          return Promise.resolve();
        });
        return;
      }
      return;

    // Execute the delivery on "PENDING" (process initiated) or "RETRY" (process manually restarted)
    case DeliveryStatus.Pending:
    case DeliveryStatus.Retry:
      update["delivery.state"] = DeliveryStatus.Processing;
      update["delivery.leaseExpireTime"] = admin.firestore.Timestamp.fromMillis(
        Date.now() + 60000
      );
      // Wrapping in transaction to allow for automatic retries (#48)
      await admin.firestore().runTransaction((transaction) => {
        transaction.update(change.after.ref, update);
        return Promise.resolve();
      });
      execute(deliver, change.after.ref);
      return;

    // Non-existing situation, here for eslint
    default:
      return;
  }
};

export default processDelivery;

import { Timestamp, FieldValue } from "@google-cloud/firestore";
import admin from "firebase-admin";

import {
  DocumentReference,
  DeliveryStatus,
  ProcessDocument,
  Change,
  DeliveryUpdate,
} from "./types";

import { wrapErrorBoundary } from "./utils";
import logger from "./logger";

export type { ProcessDocument };

/**
 * Initial `delivery` state of a delivery process. Written in form od an `DeliveryUpdate`
 * as it's written using `transaction.update` on process create.
 */
const initialDeliveryState: Required<DeliveryUpdate> = {
  startTime: FieldValue.serverTimestamp(),
  endTime: null,
  leaseExpireTime: null,
  status: DeliveryStatus.Pending,
  attempts: 0,
  error: null,
  result: null,
};

/**
 * Set up delivery state and write to process document, thus initializing
 * the delivery process. Uses `runTransaction` to make sure it will get written to firestore.
 * @param ref reference of the process document
 */
const processCreate = (ref: FirebaseFirestore.DocumentReference) =>
  admin.firestore().runTransaction((transaction) => {
    transaction.set(
      ref,
      {
        delivery: initialDeliveryState,
      },
      { merge: true }
    );
    return Promise.resolve();
  });

/**
 * The main entry point of delivery functionality
 * @param change firestore document onWrite change object
 * @param deliver an async function resolving to any value. The resolved value will be set as result in the process document delivery object.
 */
const processDelivery = async (
  change: Change,
  deliver: () => Promise<any>
): Promise<any> => {
  // Exit early on delete
  if (!change.after.exists) {
    logger.info("Document deleted, exiting");
    return null;
  }

  // Start new delivery process
  if (!change.before.exists) {
    logger.info("New process document, starting a new delivery process");
    return processCreate(change.after.ref);
  }

  const processDocument = change.after.data() as ProcessDocument;

  const delivery = processDocument.delivery as DeliveryUpdate;
  // Shouldn't ever happen
  if (!delivery) {
    logger.error(
      "No 'delivery' state in process document. This is an internal error of firestore-process-delivery."
    );
    return null;
  }

  const { leaseExpireTime } = delivery;

  switch (delivery.status) {
    case DeliveryStatus.Success:
    case DeliveryStatus.Error:
      return null;

    // Honestly, the scenario of this part bringing any utility whatsoever seems extremely (astronomically) unlikely
    // As it's a copy/edit of an existing Firebase official extension, leaving this here...might update at some point
    case DeliveryStatus.Processing:
      if (
        !leaseExpireTime ||
        (leaseExpireTime as Timestamp).toMillis() < Date.now()
      ) {
        delivery.status = DeliveryStatus.Error;
        delivery.error = "Delivery processing lease expired.";
        delivery.result = null;
        logger.info("Quitting the delivery process: Lease expired");
        return admin.firestore().runTransaction((transaction) => {
          transaction.set(change.after.ref, { delivery }, { merge: true });
          return Promise.resolve();
        });
      }
      return null;

    // Execute the delivery on "PENDING" (process initiated) or "RETRY" (process manually restarted)
    case DeliveryStatus.Pending:
    case DeliveryStatus.Retry:
      logger.info("Delivery in progress");
      delivery.status = DeliveryStatus.Processing;
      delivery.leaseExpireTime = Timestamp.fromMillis(Date.now() + 60000);
      await admin.firestore().runTransaction((transaction) => {
        transaction.set(change.after.ref, { delivery }, { merge: true });
        return Promise.resolve();
      });
      return execute(deliver, change.after.ref);

    // Non-existing situation, here for eslint
    default:
      return null;
  }
};

/**
 * Try and execute the `deliver` functionality and update the
 * delivery status (success/error) with appropriate metadata to
 * process document.
 * @param deliver An async function, the "meat" od the deliver functionality (i.e. email sending functionality)
 * @param processDocumentRef reference to the process document (with deliver `payload` and `delivery` state)
 */
const execute = async (
  deliver: () => Promise<any>,
  processDocumentRef: DocumentReference
) => {
  const delivery: DeliveryUpdate = {};

  try {
    const result = await deliver();
    // Fall back to null if result is undefined (which shouldn't really happen)
    // As firestore doesnt't allow (by default) the field value to be `undefined`
    delivery.result = result || null;
    // Annul the `delivery.error` in case there's an error from prevoius iteration
    // This might happen only on retries
    delivery.error = null;
    delivery.status = DeliveryStatus.Success;
    logger.log("Delivery successful, result: ", delivery.result);
  } catch (e) {
    delivery.status = DeliveryStatus.Error;
    delivery.result = null;
    delivery.error = (e as Error).toString();
    logger.warn("Delivery failed with error: ", delivery.error);
  }

  // Write the delivery result to the queue using transaction to enable
  // automatic retries
  return admin.firestore().runTransaction((t) => {
    t.set(processDocumentRef, { delivery }, { merge: true });
    return Promise.resolve();
  });
};

export default wrapErrorBoundary(processDelivery);

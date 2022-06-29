import * as functions from "firebase-functions";
import admin from "firebase-admin";
import {
  Collection,
  OrgSubCollection,
  BookingsErrors,
  Customer,
} from "@eisbuk/shared";

import { checkRequiredFields } from "./utils";

/**
 * Used by non-admin customers to finalize their own bookings and thus remove
 * `extendedDate` from it's own `customers` entry. This is a could funtion because
 * non-admin users aren't allowed direct access to `customers` collection.
 */
export const finalizeBookings = functions
  .region("europe-west6")
  .https.onCall(async (payload) => {
    checkRequiredFields(payload, ["id", "organization", "secretKey"]);

    const { id, organization, secretKey } =
      (payload as { id: string; organization: string; secretKey: string }) ||
      {};

    // we check "auth" by matching secretKey with customerId
    const customerRef = admin
      .firestore()
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.Customers)
      .doc(id);

    const customerInStore = await customerRef.get();

    if (!customerInStore.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        BookingsErrors.CustomerNotFound
      );
    }

    const { secretKey: existingSecretKey } = customerInStore.data() as Customer;

    if (secretKey !== existingSecretKey) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        BookingsErrors.SecretKeyMismatch
      );
    }

    // remove `extendedDate`
    await customerRef.set({ extendedDate: null }, { merge: true });
  });

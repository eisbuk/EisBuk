import * as functions from "firebase-functions";
import admin from "firebase-admin";

import {
  Collection,
  OrgSubCollection,
  BookingsErrors,
  HTTPSErrors,
  OrganizationData,
  CustomerBase,
  Customer,
  CustomerFull,
  sanitizeCustomer,
} from "@eisbuk/shared";

import { checkRequiredFields, EisbukHttpsError } from "./utils";

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

    const { secretKey: existingSecretKey } =
      customerInStore.data() as CustomerFull;

    if (secretKey !== existingSecretKey) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        BookingsErrors.SecretKeyMismatch
      );
    }

    // remove `extendedDate`
    await customerRef.set({ extendedDate: null }, { merge: true });
  });

/**
 * Used by non-admin customers to edit their own details
 * which then triggers that data to be cloned into bookings collection
 * non-admin users aren't allowed direct access to `customers` collection.
 * @param paylod.organization
 * @param payload.customer
 */
export const customerSelfUpdate = functions
  .region("europe-west6")
  .https.onCall(
    async (payload: { organization: string; customer: Customer }) => {
      checkRequiredFields(payload, ["organization", "customer"]);
      checkRequiredFields(payload.customer, ["id", "secretKey"]);

      const { organization, customer } = payload || {};

      // we check "auth" by matching secretKey with customerId
      const customerRef = admin
        .firestore()
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(OrgSubCollection.Customers)
        .doc(customer.id);

      const customerInStore = await customerRef.get();

      if (!customerInStore.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          BookingsErrors.CustomerNotFound
        );
      }

      const { secretKey: existingSecretKey } =
        customerInStore.data() as CustomerFull;

      if (customer.secretKey !== existingSecretKey) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          BookingsErrors.SecretKeyMismatch
        );
      }

      await customerRef.set({ ...customer }, { merge: true });
    }
  );

/**
 * Used by non-admin customers to self register
 * which then triggers that data to be cloned into bookings collection
 * non-admin users aren't allowed direct access to `customers` collection.
 * @param paylod.organization
 * @param payload.customer
 * @param payload.registrationCode
 */
export const customerSelfRegister = functions
  .region("europe-west6")
  .https.onCall(
    async (payload: {
      organization: string;
      registrationCode: string;
      customer: CustomerBase;
    }) => {
      checkRequiredFields(payload, ["organization", "customer"]);
      checkRequiredFields(payload.customer, [
        "name",
        "surname",
        "certificateExpiration",
        "covidCertificateReleaseDate",
      ]);

      // We require at least one of the two to be k
      if (!payload.customer.email && !payload.customer.phone) {
        const errorMessage = `${HTTPSErrors.MissingParameter}: No 'email' nor 'phone' provided, at least one is required to register.`;
        throw new EisbukHttpsError("invalid-argument", errorMessage, {
          missingFields: ["email", "phone"],
        });
      }

      const { organization, customer, registrationCode } = payload;

      const orgRef = admin
        .firestore()
        .collection(Collection.Organizations)
        .doc(organization);

      // Check if the registration code is correct
      const orgDoc = await orgRef.get();
      const orgData = orgDoc.data() as OrganizationData;
      functions.logger.info(JSON.stringify(orgData, null, 2));
      if (registrationCode !== orgData.registrationCode) {
        const errorMessage = `${HTTPSErrors.Unauth}: Incorrect value for 'registrationCode'`;
        throw new EisbukHttpsError("unauthenticated", errorMessage, {
          registrationCode,
        });
      }

      const customerRef = orgRef.collection(OrgSubCollection.Customers).doc();
      return customerRef.set(sanitizeCustomer(customer));
    }
  );

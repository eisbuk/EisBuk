import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { v4 as uuid } from "uuid";

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
  DeliveryQueue,
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
      checkRequiredFields(payload.customer, ["name", "surname"]);

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

      if (checkExpected(registrationCode, orgData.registrationCode || "")) {
        throw new EisbukHttpsError(
          "unauthenticated",
          HTTPSErrors.SelfRegInvalidCode,
          {
            registrationCode,
          }
        );
      }

      // Generate 'id' and 'secretKey' (instead of having it generated by the data trigger) so that we can immediately
      // return the 'id' and 'secretKey' and use it on the frontend (on success)
      const customerRef = orgRef.collection(OrgSubCollection.Customers).doc();

      const id = customerRef.id;
      const secretKey = uuid();

      const fullCustomer = { ...customer, id, secretKey };

      await customerRef.set(sanitizeCustomer(fullCustomer));

      // If email sending available, send an email to the admin, notifiying them of the new customer.
      const { emailFrom, smtpConfigured } = orgData;
      if (smtpConfigured && emailFrom) {
        const mailOptions = {
          from: emailFrom,
          to: emailFrom,
          subject: `New user ${fullCustomer.name} ${fullCustomer.surname}`,
          html: `New athlete has registered and is awaiting approval:
name: ${fullCustomer.name}
surname: ${fullCustomer.surname}
email: ${fullCustomer.email || "N/A"}
phone: ${fullCustomer.phone || "N/A"}

To verify the athlete, add them to a category/categories on their respective profile in '/customers' view of the admin panel.
`,
        };

        // Write the mail to the email queue for delivery
        await admin
          .firestore()
          .collection(Collection.DeliveryQueues)
          .doc(organization)
          .collection(DeliveryQueue.EmailQueue)
          .doc()
          .set(mailOptions);
      }

      return fullCustomer;
    }
  );

export const checkExpected = (input: string, expected: string) => {
  /* Compares two strings without taking into account differences
    in whitespace, punctuation, and capitalization.
    If the two strings are equal, returns true, otherwise false.
    */
  const sanitizedInput = input.replace(/[\s,!?-]/g, "").toLowerCase();
  const sanitizedExpected = expected.replace(/[\s,!?-]/g, "").toLowerCase();
  return sanitizedInput === sanitizedExpected;
};

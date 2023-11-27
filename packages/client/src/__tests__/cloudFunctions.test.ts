/**
 * @vitest-environment node
 */

import { httpsCallable, FunctionsError } from "@firebase/functions";
import { describe, expect } from "vitest";

import {
  HTTPSErrors,
  BookingsErrors,
  ClientMessagePayload,
  ClientMessageType,
  sanitizeCustomer,
  CustomerBase,
  Collection,
  Customer,
  DeliveryQueue,
  ClientMessageMethod,
} from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";

import { functions, adminDb } from "@/__testSetup__/firestoreSetup";
import { emailFrom, setUpOrganization } from "@/__testSetup__/node";

import {
  getBookingsDocPath,
  getCustomerDocPath,
  getCustomersPath,
} from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitFor } from "@/__testUtils__/helpers";

import { saul } from "@eisbuk/testing/customers";
import { DateTime } from "luxon";

describe("Cloud functions", () => {
  describe("ping", () => {
    testWithEmulator("should respond if pinged", async () => {
      const result = await httpsCallable(
        functions,
        CloudFunction.Ping
      )({
        foo: "bar",
      });
      expect(result).toEqual({ data: { pong: true, data: { foo: "bar" } } });
    });
  });

  describe("sendMail", () => {
    // Dummy data for error testing

    testWithEmulator(
      "should reject if user not authenticated (and not an admin)",
      async () => {
        const { organization } = await setUpOrganization({ doLogin: false });
        const payload = {
          type: ClientMessageType.SendBookingsLink,
          organization,
          displayName: "displayName",
          bookingsLink: "bookingsLink",
          customer: {
            name: saul.name,
            surname: saul.surname,
            email: saul.email,
          },
        };
        await expect(
          httpsCallable(functions, CloudFunction.SendEmail)(payload)
        ).rejects.toThrow(HTTPSErrors.Unauth);
      }
    );

    testWithEmulator(
      "should reject to sendEmail if no smtp secrets were set",
      async () => {
        const { organization } = await setUpOrganization({
          doLogin: true,
          setSecrets: false,
          additionalSetup: {
            emailFrom: "from@gmail.com",
            emailBcc: "bcc@gmail.com",
          },
        });
        const payload = {
          type: ClientMessageType.SendBookingsLink,
          organization,
          bookingsLink: "bookingsLink",
          name: saul.name,
          surname: saul.surname,
          email: saul.email,
        };
        await expect(
          httpsCallable(functions, CloudFunction.SendEmail)(payload)
        ).rejects.toThrow(HTTPSErrors.NoSMTPConfigured);
      }
    );

    testWithEmulator(
      "should reject if email type not provided or not of supported email type",
      async () => {
        const { organization } = await setUpOrganization({ doLogin: true });
        const payload = {
          type: "invalid-email-type",
          organization,
          displayName: "displayName",
          bookingsLink: "bookingsLink",
          customer: saul,
        };
        await expect(
          httpsCallable(functions, CloudFunction.SendEmail)(payload)
        ).rejects.toThrow(HTTPSErrors.EmailInvalidType);
      }
    );

    testWithEmulator(
      "should not reject if user not admin but has secretKey",
      async () => {
        const { organization } = await setUpOrganization({
          doLogin: false,
          setSecrets: true,
          additionalSetup: {
            emailFrom: "eisbuk@test-email.com",
          },
        });

        await adminDb.doc(getCustomerDocPath(organization, saul.id)).set(saul);

        // Wait for the bookings data trigger to run as the secret key check uses bookgins
        // collection to check for secret key being valid
        await waitFor(async () => {
          const bookingsSnap = await adminDb
            .doc(getBookingsDocPath(organization, saul.secretKey))
            .get();
          expect(Boolean(bookingsSnap.data())).toEqual(true);
        });

        const payload: ClientMessagePayload<
          ClientMessageMethod.Email,
          ClientMessageType.SendCalendarFile
        > = {
          type: ClientMessageType.SendCalendarFile,
          organization,
          attachments: {
            filename: "icsFile.ics",
            content: "content",
          },
          name: saul.name,
          surname: saul.surname,
          email: saul.email || "email@gmail.com",
          secretKey: saul.secretKey,
        };
        await expect(
          httpsCallable(functions, CloudFunction.SendEmail)(payload)
        ).resolves.toEqual(
          expect.objectContaining({
            data: expect.objectContaining({ success: true }),
          })
        );
      }
    );

    testWithEmulator(
      "should reject if no value for organziation provided",
      async () => {
        const payload = {
          type: ClientMessageType.SendBookingsLink,
          displayName: "displayName",
          bookingsLink: "string",
          customer: {
            name: saul.name,
            surname: saul.surname,
            email: saul.email,
          },
        };
        await expect(
          httpsCallable(functions, CloudFunction.SendEmail)(payload)
        ).rejects.toThrow(HTTPSErrors.Unauth);
      }
    );

    testWithEmulator("should reject if no recipient provided", async () => {
      const { organization } = await setUpOrganization();
      const payload = {
        type: ClientMessageType.SendBookingsLink,
        organization,
        bookingsLink: "string",
        customer: {
          name: saul.name,
          surname: saul.surname,
          secretKey: saul.secretKey,
        },
      };
      try {
        await httpsCallable(functions, CloudFunction.SendEmail)(payload);
      } catch (error) {
        expect((error as FunctionsError).message).toEqual(
          expect.stringContaining("must have required property 'email'")
        );
      }
    });
  });

  describe("finalizeBookings", () => {
    testWithEmulator(
      "should remove extended date from customer's data in firestore, and, in effect, customer's bookings",
      async () => {
        // set up test state
        const { organization } = await setUpOrganization();
        const saulRef = adminDb.doc(getCustomerDocPath(organization, saul.id));
        await saulRef.set({ ...saul, extendedDate: "2022-01-01" });
        // wait for bookings to get created (through data trigger)
        await waitFor(async () => {
          const bookingsSnap = await adminDb
            .doc(getBookingsDocPath(organization, saul.secretKey))
            .get();
          expect(Boolean(bookingsSnap.data()?.extendedDate)).toEqual(true);
        });
        // run the function
        await httpsCallable(
          functions,
          CloudFunction.FinalizeBookings
        )({
          id: saul.id,
          organization,
          secretKey: saul.secretKey,
        });
        // wait for the bookings data to update
        await waitFor(async () => {
          const bookingsSnap = await adminDb
            .doc(getBookingsDocPath(organization, saul.secretKey))
            .get();
          expect(Boolean(bookingsSnap.data()?.extendedDate)).toEqual(false);
        });
      }
    );

    testWithEmulator(
      "should return an error if no payload provided",
      async () => {
        await expect(
          httpsCallable(functions, CloudFunction.FinalizeBookings)()
        ).rejects.toThrow(HTTPSErrors.NoPayload);
      }
    );

    testWithEmulator(
      "should return an error if no organziation, id or secretKey provided",
      async () => {
        try {
          await httpsCallable(functions, CloudFunction.FinalizeBookings)({});
        } catch (error) {
          expect((error as FunctionsError).message).toEqual(
            `${HTTPSErrors.MissingParameter}: id, organization, secretKey`
          );
        }
      }
    );

    testWithEmulator(
      "should return an error if customer id and secretKey mismatch",
      async () => {
        const { organization } = await setUpOrganization();
        const saulRef = adminDb.doc(getCustomerDocPath(organization, saul.id));
        await saulRef.set(saul);
        await expect(
          httpsCallable(
            functions,
            CloudFunction.FinalizeBookings
          )({
            organization,
            id: saul.id,
            secretKey: "wrong-key",
          })
        ).rejects.toThrow(BookingsErrors.SecretKeyMismatch);
      }
    );

    testWithEmulator(
      "should return an error if customer not found",
      async () => {
        const { organization } = await setUpOrganization();
        await expect(
          httpsCallable(
            functions,
            CloudFunction.FinalizeBookings
          )({
            organization,
            id: saul.id,
            secretKey: saul.secretKey,
          })
        ).rejects.toThrow(BookingsErrors.CustomerNotFound);
      }
    );
  });

  describe("acceptPrivacyPolicy", () => {
    testWithEmulator(
      "should store the timestamp of confirmation to the customer's structure in the db",
      async () => {
        // set up test state
        const { organization } = await setUpOrganization();
        const saulRef = adminDb.doc(getCustomerDocPath(organization, saul.id));
        await saulRef.set(saul);
        // wait for bookings to get created (through data trigger)
        await waitFor(() =>
          adminDb.doc(getBookingsDocPath(organization, saul.secretKey)).get()
        );
        // Timestamp used for the test, the actual time doesn't matter,
        // only that it's stord in the db after the function is ran.
        const timestamp = DateTime.now().toISO();
        // run the function
        await httpsCallable(
          functions,
          CloudFunction.AcceptPrivacyPolicy
        )({
          id: saul.id,
          organization,
          secretKey: saul.secretKey,
          timestamp,
        });
        const customerSnap = await saulRef.get();
        expect(customerSnap.data()?.privacyPolicyAccepted).toEqual({
          timestamp,
        });
        // wait for the bookings data to update
        await waitFor(async () => {
          const bookingsSnap = await adminDb
            .doc(getBookingsDocPath(organization, saul.secretKey))
            .get();
          // The privacy policy confirmation timestamp should be stored in the db
          expect(bookingsSnap.data()?.privacyPolicyAccepted).toEqual({
            timestamp,
          });
        });
      }
    );

    testWithEmulator(
      "should return an error if no payload provided",
      async () => {
        await expect(
          httpsCallable(functions, CloudFunction.AcceptPrivacyPolicy)()
        ).rejects.toThrow(HTTPSErrors.NoPayload);
      }
    );

    testWithEmulator(
      "should return an error if no organziation, id, secretKey or timestamp provided",
      async () => {
        try {
          await httpsCallable(functions, CloudFunction.AcceptPrivacyPolicy)({});
        } catch (error) {
          expect((error as FunctionsError).message).toEqual(
            `${HTTPSErrors.MissingParameter}: id, organization, secretKey, timestamp`
          );
        }
      }
    );

    testWithEmulator(
      "should return an error if customer id and secretKey mismatch",
      async () => {
        const { organization } = await setUpOrganization();
        const saulRef = adminDb.doc(getCustomerDocPath(organization, saul.id));
        await saulRef.set(saul);
        await expect(
          httpsCallable(
            functions,
            CloudFunction.AcceptPrivacyPolicy
          )({
            organization,
            id: saul.id,
            secretKey: "wrong-key",
            timestamp: DateTime.now().toISO(),
          })
        ).rejects.toThrow(BookingsErrors.SecretKeyMismatch);
      }
    );

    testWithEmulator(
      "should return an error if customer not found",
      async () => {
        const { organization } = await setUpOrganization();
        await expect(
          httpsCallable(
            functions,
            CloudFunction.AcceptPrivacyPolicy
          )({
            organization,
            id: saul.id,
            secretKey: saul.secretKey,
            timestamp: DateTime.now().toISO(),
          })
        ).rejects.toThrow(BookingsErrors.CustomerNotFound);
      }
    );
  });

  describe("customerSelfUpdate", () => {
    testWithEmulator(
      "should update customer data in customer collection and then bookings collection by data trigger",
      async () => {
        // set up test state
        const { organization } = await setUpOrganization();
        const saulRef = adminDb.doc(getCustomerDocPath(organization, saul.id));
        await saulRef.set(saul);

        // wait for bookings to get created (through data trigger)
        await waitFor(async () => {
          const bookingsSnap = await adminDb
            .doc(getBookingsDocPath(organization, saul.secretKey))
            .get();
          expect(Boolean(bookingsSnap.data())).toEqual(true);
        });

        // run the function to update customer
        await httpsCallable(
          functions,
          CloudFunction.CustomerSelfUpdate
        )({
          organization,
          customer: saul,
        });

        // check that customer has been updated
        await waitFor(async () => {
          const bookingsSnap = await adminDb
            .doc(getBookingsDocPath(organization, saul.secretKey))
            .get();
          expect(bookingsSnap.data()).toEqual(sanitizeCustomer(saul));
        });
      }
    );

    testWithEmulator(
      "should return an error if no payload provided",
      async () => {
        await expect(
          httpsCallable(functions, CloudFunction.CustomerSelfUpdate)()
        ).rejects.toThrow(HTTPSErrors.NoPayload);
      }
    );

    testWithEmulator(
      "should return an error if no organziation, or customer provided",
      async () => {
        try {
          await httpsCallable(functions, CloudFunction.CustomerSelfUpdate)({});
        } catch (error) {
          expect((error as FunctionsError).message).toEqual(
            `${HTTPSErrors.MissingParameter}: organization, customer`
          );
        }
      }
    );

    testWithEmulator(
      "should return an error if id or secretKey are not provided in customer object",
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, secretKey, ...saulNoId } = saul;
        try {
          await httpsCallable(
            functions,
            CloudFunction.CustomerSelfUpdate
          )({
            organization: {},
            customer: saulNoId,
          });
        } catch (error) {
          expect((error as FunctionsError).message).toEqual(
            `${HTTPSErrors.MissingParameter}: id, secretKey`
          );
        }
      }
    );

    testWithEmulator(
      "should return an error if customer id and secretKey mismatch",
      async () => {
        const { organization } = await setUpOrganization();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { secretKey, ...saulNoSecretKey } = saul;
        const saulRef = adminDb.doc(getCustomerDocPath(organization, saul.id));
        await saulRef.set(saul);
        await expect(
          httpsCallable(
            functions,
            CloudFunction.CustomerSelfUpdate
          )({
            organization,
            customer: { ...saulNoSecretKey, secretKey: "wrong-key" },
          })
        ).rejects.toThrow(BookingsErrors.SecretKeyMismatch);
      }
    );

    testWithEmulator(
      "should return an error if customer not found",
      async () => {
        const { organization } = await setUpOrganization();
        await expect(
          httpsCallable(
            functions,
            CloudFunction.CustomerSelfUpdate
          )({
            organization,
            customer: saul,
          })
        ).rejects.toThrow(BookingsErrors.CustomerNotFound);
      }
    );
  });

  describe("customerSelfRegister", () => {
    const minimalSaul: CustomerBase = {
      name: saul.name,
      surname: saul.surname,
      // non-normalized email
      email:
        " " +
        saul.email!.replace(/.*@|o|g/g, (match) => match.toUpperCase()) +
        " ",
      certificateExpiration: saul.certificateExpiration,
    };
    testWithEmulator(
      "should create a new customer with data passed in as well as bookings entry",
      async () => {
        const registrationCode = "CODE111";

        // set up test state
        const { organization } = await setUpOrganization({ doLogin: false });
        await adminDb
          .collection(Collection.Organizations)
          .doc(organization)
          .set({ registrationCode }, { merge: true });

        // run the function to update customer
        await httpsCallable(
          functions,
          CloudFunction.CustomerSelfRegister
        )({
          organization,
          registrationCode,
          customer: minimalSaul,
        });

        const customersColl = await adminDb
          .collection(getCustomersPath(organization))
          .get();
        const customerDoc = customersColl.docs[0];

        // Get newly created customer's 'secretKey'
        const { id, secretKey } = await waitFor(async () => {
          const customerSnap = await customerDoc.ref.get();
          const customerData = customerSnap.data() as Customer;
          const { secretKey, id } = customerData;

          expect(Boolean(secretKey)).toEqual(true);
          expect(Boolean(id)).toEqual(true);
          expect(customerData).toEqual({
            ...minimalSaul,
            email: saul.email,
            secretKey,
            id,
            // Should set up empty categories
            categories: [],
          });

          return customerData;
        });

        // Check that bookings doc has been created
        await waitFor(async () => {
          const bookingsSnap = await adminDb
            .doc(getBookingsDocPath(organization, secretKey))
            .get();
          expect(bookingsSnap.data()).toEqual(
            sanitizeCustomer({
              ...minimalSaul,
              email: saul.email,

              secretKey,
              id,
            } as Customer)
          );
        });

        // As smtp is configured, check that an email has been sent to the admin
        const emailQueue = await adminDb
          .collection(Collection.DeliveryQueues)
          .doc(organization)
          .collection(DeliveryQueue.EmailQueue)
          .get();

        expect(emailQueue.docs[0].data()).toEqual(
          expect.objectContaining({
            subject: expect.stringContaining(saul.name),
            html: expect.stringContaining(saul.email!),
            to: emailFrom,
            from: emailFrom,
          })
        );
      }
    );

    testWithEmulator(
      "should return an error if no payload provided",
      async () => {
        await expect(
          httpsCallable(functions, CloudFunction.CustomerSelfRegister)()
        ).rejects.toThrow(HTTPSErrors.NoPayload);
      }
    );

    testWithEmulator(
      "should return an error if no organization, or customer provided",
      async () => {
        try {
          await httpsCallable(
            functions,
            CloudFunction.CustomerSelfRegister
          )({});
        } catch (error) {
          expect((error as FunctionsError).message).toEqual(
            `${HTTPSErrors.MissingParameter}: organization, customer`
          );
        }
      }
    );

    testWithEmulator(
      "should return an error if 'email' nor 'phone' are not provided in customer object",
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { email, ...saulNoEmail } = minimalSaul;
        try {
          await httpsCallable(
            functions,
            CloudFunction.CustomerSelfRegister
          )({
            organization: "dummy-organization",
            registrationCode: "not-real-code",
            customer: saulNoEmail,
          });
        } catch (error) {
          expect((error as FunctionsError).message).toEqual(
            `${HTTPSErrors.MissingParameter}: No 'email' nor 'phone' provided, at least one is required to register.`
          );
        }
      }
    );

    testWithEmulator("should validate registration code", async () => {
      // Test setup
      const { organization } = await setUpOrganization();
      await adminDb
        .collection(Collection.Organizations)
        .doc(organization)
        .set({ registrationCode: "registration-code" }, { merge: true });

      try {
        await httpsCallable(
          functions,
          CloudFunction.CustomerSelfRegister
        )({
          organization,
          registrationCode: "not-real-code",
          customer: minimalSaul,
        });
      } catch (error) {
        expect((error as FunctionsError).message).toEqual(
          HTTPSErrors.SelfRegInvalidCode
        );
      }
    });
  });
});

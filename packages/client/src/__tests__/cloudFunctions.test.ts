/**
 * @jest-environment node
 */

import { httpsCallable, FunctionsError } from "@firebase/functions";

import {
  HTTPSErrors,
  BookingsErrors,
  ClientEmailPayload,
  EmailType,
  sanitizeCustomer,
  CustomerBase,
  Collection,
  Customer,
  DeliveryQueue,
} from "@eisbuk/shared";

import { functions, adminDb } from "@/__testSetup__/firestoreSetup";
import { emailFrom, setUpOrganization } from "@/__testSetup__/node";

import { CloudFunction } from "@/enums/functions";

import {
  getBookingsDocPath,
  getCustomerDocPath,
  getCustomersPath,
} from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitForCondition } from "@/__testUtils__/helpers";

import { saul } from "@/__testData__/customers";

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
          type: EmailType.SendBookingsLink,
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
          type: EmailType.SendBookingsLink,
          organization,
          bookingsLink: "bookingsLink",
          customer: {
            name: saul.name,
            surname: saul.surname,
            email: saul.email,
          },
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
        await waitForCondition({
          documentPath: getBookingsDocPath(organization, saul.secretKey),
          condition: (data) => Boolean(data),
        });

        const payload: ClientEmailPayload[EmailType.SendCalendarFile] = {
          type: EmailType.SendCalendarFile,
          organization,
          attachments: {
            filename: "icsFile.ics",
            content: "content",
          },
          customer: {
            name: saul.name,
            surname: saul.surname,
            email: saul.email || "email@gmail.com",
            secretKey: saul.secretKey,
          },
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
          type: EmailType.SendBookingsLink,
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

    test("should reject if no recipient provided", async () => {
      const { organization } = await setUpOrganization();
      const payload = {
        type: EmailType.SendBookingsLink,
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
        await waitForCondition({
          documentPath: getBookingsDocPath(organization, saul.secretKey),
          condition: (data) => Boolean(data?.extendedDate),
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
        await waitForCondition({
          documentPath: getBookingsDocPath(organization, saul.secretKey),
          condition: (data) => !data?.extendedDate,
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

  describe("customerSelfUpdate", () => {
    testWithEmulator(
      "should update customer data in customer collection and then bookings collection by data trigger",
      async () => {
        // set up test state
        const { organization } = await setUpOrganization();
        const saulRef = adminDb.doc(getCustomerDocPath(organization, saul.id));
        await saulRef.set(saul);

        // wait for bookings to get created (through data trigger)
        await waitForCondition({
          documentPath: getBookingsDocPath(organization, saul.secretKey),
          condition: (data) => Boolean(data),
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
        const updatedData = await waitForCondition({
          documentPath: getBookingsDocPath(organization, saul.secretKey),
          condition: (data) => Boolean(data),
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        expect(updatedData).toEqual(sanitizeCustomer(saul));
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
      email: saul.email,
      certificateExpiration: saul.certificateExpiration,
      covidCertificateReleaseDate: saul.covidCertificateReleaseDate,
      covidCertificateSuspended: saul.covidCertificateSuspended,
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
        const customerInDb = (await waitForCondition({
          documentPath: customerDoc.ref.path,
          condition: (data) => Boolean(data?.secretKey && data?.id),
        })) as Customer;

        const { secretKey, id } = customerInDb;

        // Check that the customer has been properly updated
        expect(secretKey).toBeTruthy();
        expect(id).toBeTruthy();
        expect(customerDoc.data()).toEqual({
          ...minimalSaul,
          secretKey,
          id,
          // Should set up empty categories
          categories: [],
        });

        // Check that bookings doc has been created
        const bookingsCustomer = await waitForCondition({
          documentPath: getBookingsDocPath(organization, secretKey),
          condition: (data) => Boolean(data),
        });

        expect(bookingsCustomer).toEqual(
          sanitizeCustomer({
            ...minimalSaul,
            secretKey,
            id,
          } as Customer)
        );

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

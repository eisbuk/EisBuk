import { httpsCallable } from "@firebase/functions";
import { signOut } from "@firebase/auth";

import {
  Collection,
  HTTPErrors,
  OrgSubCollection,
  SendEmailErrors,
  BookingsErrors,
} from "eisbuk-shared";

import { auth, functions, adminDb } from "@/__testSetup__/firestoreSetup";

import { getOrganization } from "@/lib/getters";

import { CloudFunction } from "@/enums/functions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { loginDefaultUser } from "@/__testUtils__/auth";
import { deleteAll } from "@/__testUtils__/firestore";
import { getDocumentRef, waitForCondition } from "@/__testUtils__/helpers";

import { saul } from "@/__testData__/customers";

describe("Cloud functions", () => {
  beforeEach(async () => {
    await loginDefaultUser();
  });

  afterEach(async () => {
    await deleteAll();
  });

  describe("ping", () => {
    testWithEmulator("should respond if pinged", async (done) => {
      const result = await httpsCallable(
        functions,
        CloudFunction.Ping
      )({
        foo: "bar",
      });
      expect(result).toEqual({ data: { pong: true, data: { foo: "bar" } } });
      done();
    });
  });

  describe("sendMail", () => {
    // Dummy data for error testing
    const to = "saul@gmail.com";
    const subject = "Subject";
    const html = "html";
    const organization = getOrganization();

    testWithEmulator(
      "should reject if user not authenticaten (and not an admin)",
      async () => {
        await signOut(auth);
        await expect(
          httpsCallable(
            functions,
            CloudFunction.SendEmail
          )({ organization, message: { html, subject } })
        ).rejects.toThrow(HTTPErrors.Unauth);
      }
    );

    testWithEmulator("should reject if no payload provided", async () => {
      await expect(
        httpsCallable(functions, CloudFunction.SendEmail)()
      ).rejects.toThrow(HTTPErrors.NoPayload);
    });

    testWithEmulator(
      "should reject if no value for organziation provided",
      async () => {
        await expect(
          httpsCallable(
            functions,
            CloudFunction.SendEmail
          )({ to, message: { html, subject } })
        ).rejects.toThrow(HTTPErrors.Unauth);
      }
    );

    testWithEmulator("should reject if no recipient provided", async () => {
      await expect(
        httpsCallable(
          functions,
          CloudFunction.SendEmail
        )({ organization, message: { html, subject } })
      ).rejects.toThrow(SendEmailErrors.NoRecipient);
    });

    testWithEmulator("should reject if no email body provided", async () => {
      await expect(
        httpsCallable(
          functions,
          CloudFunction.SendEmail
        )({ to, organization, message: { subject } })
      ).rejects.toThrow(SendEmailErrors.NoMsgBody);
    });

    testWithEmulator("should reject if no subject provided", async () => {
      await expect(
        httpsCallable(
          functions,
          CloudFunction.SendEmail
        )({ to, organization, message: { html } })
      ).rejects.toThrow(SendEmailErrors.NoSubject);
    });
  });

  describe("finalizeBookings", () => {
    const saulPath = [
      Collection.Organizations,
      getOrganization(),
      OrgSubCollection.Customers,
      saul.id,
    ].join("/");

    testWithEmulator(
      "should remove extended date from customer's data in firestore, and, in effect, customer's bookings",
      async () => {
        // set up test state
        const saulBookingsPath = [
          Collection.Organizations,
          getOrganization(),
          OrgSubCollection.Bookings,
          saul.secretKey,
        ].join("/");
        const saulRef = getDocumentRef(adminDb, saulPath);
        await saulRef.set({ ...saul, extendedDate: "2022-01-01" });
        // wait for bookings to get created (through data trigger)
        await waitForCondition({
          documentPath: saulBookingsPath,
          condition: (data) => Boolean(data?.extendedDate),
        });
        // run the function
        await httpsCallable(
          functions,
          CloudFunction.FinalizeBookings
        )({
          id: saul.id,
          organization: getOrganization(),
          secretKey: saul.secretKey,
        });
        // wait for the bookings data to update
        await waitForCondition({
          documentPath: saulBookingsPath,
          condition: (data) => !data?.extendedDate,
        });
      }
    );

    testWithEmulator(
      "should return an error if no payload provided",
      async () => {
        // run the function
        await expect(
          httpsCallable(functions, CloudFunction.FinalizeBookings)()
        ).rejects.toThrow(HTTPErrors.NoPayload);
      }
    );

    testWithEmulator(
      "should return an error if no organziation provided",
      async () => {
        // run the function
        await expect(
          httpsCallable(
            functions,
            CloudFunction.FinalizeBookings
          )({ id: saul.id })
        ).rejects.toThrow(HTTPErrors.NoOrganziation);
      }
    );

    testWithEmulator(
      "should return an error if no id for customer provided",
      async () => {
        // run the function
        await expect(
          httpsCallable(
            functions,
            CloudFunction.FinalizeBookings
          )({ organization: getOrganization() })
        ).rejects.toThrow(BookingsErrors.NoCustomerId);
      }
    );

    testWithEmulator(
      "should return an error if no secretKey provided",
      async () => {
        // run the function
        await expect(
          httpsCallable(
            functions,
            CloudFunction.FinalizeBookings
          )({ organization: getOrganization(), id: saul.id })
        ).rejects.toThrow(BookingsErrors.NoSecretKey);
      }
    );

    testWithEmulator(
      "should return an error if customer id and secretKey mismatch",
      async () => {
        const saulRef = getDocumentRef(adminDb, saulPath);
        await saulRef.set(saul);
        // run the function
        await expect(
          httpsCallable(
            functions,
            CloudFunction.FinalizeBookings
          )({
            organization: getOrganization(),
            id: saul.id,
            secretKey: "wrong-key",
          })
        ).rejects.toThrow(BookingsErrors.SecretKeyMismatch);
      }
    );

    testWithEmulator(
      "should return an error if customer not found",
      async () => {
        // run the function
        await expect(
          httpsCallable(
            functions,
            CloudFunction.FinalizeBookings
          )({
            organization: getOrganization(),
            id: saul.id,
            secretKey: saul.secretKey,
          })
        ).rejects.toThrow(BookingsErrors.CustomerNotFound);
      }
    );
  });
});

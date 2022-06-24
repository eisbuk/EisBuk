/**
 * @jest-environment node
 */

import { httpsCallable, FunctionsError } from "@firebase/functions";

import { HTTPSErrors, BookingsErrors } from "@eisbuk/shared";

import { functions, adminDb } from "@/__testSetup__/firestoreSetup";

import { CloudFunction } from "@/enums/functions";

import { setUpOrganization } from "@/__testSetup__/node";

import { getBookingsDocPath, getCustomerDocPath } from "@/utils/firestore";

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
    const to = "saul@gmail.com";
    const subject = "Subject";
    const html = "html";

    testWithEmulator(
      "should reject if user not authenticaten (and not an admin)",
      async () => {
        const { organization } = await setUpOrganization(false);
        await expect(
          httpsCallable(
            functions,
            CloudFunction.SendEmail
          )({ organization, html, subject })
        ).rejects.toThrow(HTTPSErrors.Unauth);
      }
    );

    testWithEmulator(
      "should reject if no value for organziation provided",
      async () => {
        await expect(
          httpsCallable(
            functions,
            CloudFunction.SendEmail
          )({ to, html, subject })
        ).rejects.toThrow(HTTPSErrors.Unauth);
      }
    );

    testWithEmulator(
      "should reject if no recipient, html or subject provided",
      async () => {
        let error = new Error();
        const { organization } = await setUpOrganization();
        try {
          await httpsCallable(
            functions,
            CloudFunction.SendEmail
          )({ organization });
        } catch (err) {
          error = err as Error;
        }
        expect((error as FunctionsError).message).toEqual(
          `${HTTPSErrors.MissingParameter}: to, subject, html`
        );
      }
    );
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
});

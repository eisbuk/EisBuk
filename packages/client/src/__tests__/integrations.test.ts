import { describe, expect, beforeEach, afterAll } from "vitest";
import { httpsCallable } from "@firebase/functions";
import { createJestSMTPServer } from "jest-smtp";

import { ClientEmailPayload, CustomerFull, EmailType } from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";
import { DeliveryStatus } from "@eisbuk/firestore-process-delivery";

import { saul } from "@eisbuk/testing/customers";

import { setUpOrganization, smtpHost, smtpPort } from "@/__testSetup__/node";
import { adminDb, functions } from "@/__testSetup__/firestoreSetup";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitFor } from "@/__testUtils__/helpers";

/**
 * @TODO this following test is skipped as it produces flakiness: investigate and fix.
 */
describe.skip("Email sending and delivery", () => {
  // Dummy data for error testing
  const smtpServer = createJestSMTPServer({
    port: smtpPort,
    host: smtpHost,
  });

  afterAll(smtpServer.close);

  beforeEach(smtpServer.resetEmails);

  testWithEmulator(
    "should deliver an email with correct message and recipients",
    async () => {
      const { organization } = await setUpOrganization({
        doLogin: true,
        setSecrets: true,
        additionalSetup: {
          emailFrom: "from@gmail.com",
          emailBcc: "bcc@gmail.com",
        },
      });

      const recipients: string[] = [];

      // Override 'onRcptTo' to keep track of recipients for an email
      smtpServer.server.onRcptTo = (
        addr: { address: string },
        _: any,
        done: () => void
      ) => {
        recipients.push(addr.address);
        done();
      };

      const payload: ClientEmailPayload[EmailType.SendBookingsLink] = {
        type: EmailType.SendBookingsLink,
        organization,
        customer: saul as Required<CustomerFull>,
        bookingsLink: "https://eisbuk.it/saul",
      };

      const res = await httpsCallable(
        functions,
        CloudFunction.SendEmail
      )(payload);

      const deliveryDocPath = (res.data as any).deliveryDocumentPath;

      // Wait for the process delivery to complete before making further assertions
      await waitFor(async () => {
        const deliverySnap = await adminDb.doc(deliveryDocPath).get();
        expect(deliverySnap.data()?.delivery?.status).toEqual(
          DeliveryStatus.Success
        );
      });

      // There should be a single email payload, but with multiple recipients ('to' and 'bcc')
      expect(smtpServer).toHaveReceivedEmails(1);
      expect(recipients.length).toEqual(2);
      expect(recipients).toContain("saul@gmail.com");
      expect(recipients).toContain("bcc@gmail.com");
    }
  );
});

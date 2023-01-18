import { httpsCallable } from "@firebase/functions";
import { createJestSMTPServer } from "jest-smtp";

import {
  ClientEmailPayload,
  CustomerFull,
  EmailPayload,
  EmailType,
} from "@eisbuk/shared";
import {
  DeliveryStatus,
  ProcessDocument,
} from "@eisbuk/firestore-process-delivery";

import { CloudFunction } from "@/enums/functions";

import { setUpOrganization, smtpHost, smtpPort } from "@/__testSetup__/node";
import { functions } from "@/__testSetup__/firestoreSetup";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitForCondition } from "@/__testUtils__/helpers";

import { saul } from "@/__testData__/customers";

describe("Email sending and delivery", () => {
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
      await waitForCondition<ProcessDocument<EmailPayload>>({
        documentPath: deliveryDocPath,
        condition: (data) => data?.delivery?.status === DeliveryStatus.Success,
        verbose: true,
      });

      // There should be a single email payload, but with multiple recipients ('to' and 'bcc')
      expect(smtpServer).toHaveReceivedEmails(1);
      expect(recipients.length).toEqual(2);
      expect(recipients).toContain("saul@gmail.com");
      expect(recipients).toContain("bcc@gmail.com");
    }
  );
});

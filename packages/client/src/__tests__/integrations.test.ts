import { httpsCallable } from "@firebase/functions";
import { createJestSMTPServer } from "jest-smtp";

import { EmailMessage } from "@eisbuk/shared";
import {
  DeliveryStatus,
  ProcessDocument,
} from "@eisbuk/firestore-process-delivery";

import { CloudFunction } from "@/enums/functions";

import { setUpOrganization } from "@/__testSetup__/node";
import { functions } from "@/__testSetup__/firestoreSetup";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitForCondition } from "@/__testUtils__/helpers";

describe("Email sending and delivery", () => {
  // Dummy data for error testing
  const to = "saul@gmail.com";
  const subject = "Subject";
  const html = "html";
  const smtpServer = createJestSMTPServer({
    port: 5000,
    host: "localhost",
  });

  afterAll(smtpServer.close);

  beforeEach(smtpServer.resetEmails);

  testWithEmulator(
    "shold deliver an email with correct message and recipients",
    async () => {
      /** @TODO pass false as dologin when we figure out why secretkey accepted as authorized access */
      const { organization } = await setUpOrganization(true, true, {
        emailFrom: "from@gmail.com",
        emailBcc: "bcc@gmail.com",
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

      const res = await httpsCallable(
        functions,
        CloudFunction.SendEmail
      )({ organization, to, html, subject });

      const deliveryDocPath = (res.data as any).deliveryDocumentPath;

      // Wait for the process delivery to complete before making further assertions
      await waitForCondition<ProcessDocument<EmailMessage>>({
        documentPath: deliveryDocPath,
        condition: (data) => data?.delivery?.status === DeliveryStatus.Success,
      });

      // There should be a single email payload, but with multiple recipients ('to' and 'bcc')
      expect(smtpServer).toHaveReceivedEmails(1);
      expect(recipients.length).toEqual(2);
      expect(recipients).toContain("saul@gmail.com");
      expect(recipients).toContain("bcc@gmail.com");
    }
  );
});

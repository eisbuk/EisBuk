import { httpsCallable } from "@firebase/functions";
import { createJestSMTPServer } from "jest-smtp";

import {
  ClientEmailPayload,
  CustomerFull,
  EmailPayload,
  EmailType,
  defaultEmailTemplates,
  interpolateText,
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
    "shold deliver an email with correct message and recipients",
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
  testWithEmulator(
    "shold deliver an email of type SendBookingsLink with correct email fields",
    async () => {
      const { organization } = await setUpOrganization({
        doLogin: true,
        setSecrets: true,
        additionalSetup: {
          emailFrom: "from@gmail.com",
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

      const bookingsLink = "https://eisbuk.it/saul";
      const payload: ClientEmailPayload[EmailType.SendBookingsLink] = {
        type: EmailType.SendBookingsLink,
        organization,
        customer: saul as Required<CustomerFull>,
        bookingsLink,
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
      const email = smtpServer.emails[0];

      const interpolatedHtml = interpolateText(
        defaultEmailTemplates[EmailType.SendBookingsLink].html,
        {
          organizationName: organization,
          name: saul.name,
          surname: saul.surname,
          bookingsLink,
        }
      );
      const interpolatedSubject = interpolateText(
        defaultEmailTemplates[EmailType.SendBookingsLink].subject,
        {
          organizationName: organization,
        }
      );

      expect(email.html.trim()).toEqual(interpolatedHtml);
      expect(email.subject.trim()).toEqual(interpolatedSubject);
      expect(recipients.length).toEqual(2);
    }
  );
  testWithEmulator(
    "shold deliver an email of type SendCalendarFile with correct email fields",
    async () => {
      const { organization } = await setUpOrganization({
        doLogin: true,
        setSecrets: true,
        additionalSetup: {
          emailFrom: "from@gmail.com",
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

      const payload: ClientEmailPayload[EmailType.SendCalendarFile] = {
        type: EmailType.SendCalendarFile,
        organization,
        customer: saul as Required<CustomerFull>,
        attachments: {
          filename: "icsFile.ics",
          content: "icsFile",
        },
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
      const email = smtpServer.emails[0];

      const interpolatedHtml = interpolateText(
        defaultEmailTemplates[EmailType.SendCalendarFile].html,
        {
          organizationName: organization,
          name: saul.name,
          surname: saul.surname,
          icsFile: "icsFile.ics",
        }
      );

      const interpolatedSubject = interpolateText(
        defaultEmailTemplates[EmailType.SendCalendarFile].subject,
        {
          organizationName: organization,
        }
      );

      expect(email.subject.trim()).toEqual(interpolatedSubject);
      expect(email.html.trim()).toEqual(interpolatedHtml);
      expect(email.attachments[0].contentType).toEqual("text/calendar");
      expect(email.attachments[0].filename).toEqual("icsFile.ics");
    }
  );
  testWithEmulator(
    "shold deliver an email of type SendExtendedBookingsDate with correct email fields",
    async () => {
      const { organization } = await setUpOrganization({
        doLogin: true,
        setSecrets: true,
        additionalSetup: {
          emailFrom: "from@gmail.com",
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

      const extendedBookingsDate = "04/02";
      const bookingsMonth = "April";

      const payload: ClientEmailPayload[EmailType.SendExtendedBookingsDate] = {
        type: EmailType.SendExtendedBookingsDate,
        organization,
        customer: saul as Required<CustomerFull>,
        extendedBookingsDate,
        bookingsMonth,
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
      const email = smtpServer.emails[0];

      const interpolatedHtml = interpolateText(
        defaultEmailTemplates[EmailType.SendExtendedBookingsDate].html,
        {
          organizationName: organization,
          name: saul.name,
          surname: saul.surname,
          extendedBookingsDate,
          bookingsMonth,
        }
      );

      const interpolatedSubject = interpolateText(
        defaultEmailTemplates[EmailType.SendExtendedBookingsDate].subject,
        {
          name: saul.name,
        }
      );

      expect(email.subject.trim()).toEqual(interpolatedSubject);
      expect(email.html.trim()).toEqual(interpolatedHtml);
    }
  );
});

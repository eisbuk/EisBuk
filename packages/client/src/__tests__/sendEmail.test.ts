import { describe, expect, test } from "vitest";
import {
  ClientEmailPayload,
  EmailType,
  interpolateText,
  defaultEmailTemplates,
  EmailInterpolationValues,
} from "@eisbuk/shared";

import { saul } from "@eisbuk/testing/customers";

import { setUpOrganization } from "@/__testSetup__/node";
import { adminDb, functions } from "@/__testSetup__/firestoreSetup";
import { httpsCallable } from "@firebase/functions";
import { CloudFunction } from "@/enums/functions";

type SendEmailTest =
  | {
      type: EmailType.SendBookingsLink;
      payload: Pick<
        ClientEmailPayload[EmailType.SendBookingsLink],
        "bookingsLink"
      >;
    }
  | {
      type: EmailType.SendCalendarFile;
      payload: Pick<
        ClientEmailPayload[EmailType.SendCalendarFile],
        "attachments"
      >;
    }
  | {
      type: EmailType.SendExtendedBookingsDate;
      payload: Pick<
        ClientEmailPayload[EmailType.SendExtendedBookingsDate],
        "extendedBookingsDate" | "bookingsMonth"
      >;
    };

/**
 * Runs table tests from the payload passed in (for each email type)
 * Unlike other table tests, the assertions are not in the payload, but rather
 * handled internally, by constructing the interpolation values and checking
 * against the default templates.
 */
const runSendEmailTableTests = (tests: SendEmailTest[]) => {
  const setup = {
    doLogin: true,
    setSecrets: true,
    additionalSetup: {
      emailFrom: "eisbuk@email.com",
      emailBcc: "bcc@gmail.com",
    },
  };

  tests.forEach(({ type, payload }) => {
    test(`should construct an email of type ${type} and hand it over for delivery`, async () => {
      const { organization } = await setUpOrganization(setup);

      const {
        data: { success, deliveryDocumentPath },
      } = await httpsCallable<
        unknown,
        {
          deliveryDocumentPath: string;
          success: boolean;
        }
      >(
        functions,
        CloudFunction.SendEmail
      )({ type, ...payload, organization, customer: saul });

      expect(success).toEqual(true);

      // Check the process document
      const deliveryDocPath = deliveryDocumentPath;
      const deliveryDoc = await adminDb.doc(deliveryDocPath).get();
      const deliveryDocData = deliveryDoc.data();

      const interpolationValues: EmailInterpolationValues = {
        name: saul.name,
        surname: saul.surname,
        organizationName: organization,
      };

      // In case of send bookings link, add bookings link specific interpolation values
      if (type === EmailType.SendBookingsLink) {
        interpolationValues.bookingsLink = payload.bookingsLink;
      }

      // In case of send calendar file, add calendar file specific interpolation values
      if (type === EmailType.SendCalendarFile) {
        interpolationValues.calendarFile = payload.attachments.filename;
      }

      // In case of send extended bookings date, add extended bookings date specific interpolation values
      if (type === EmailType.SendExtendedBookingsDate) {
        interpolationValues.bookingsMonth = payload.bookingsMonth;
        interpolationValues.extendedBookingsDate = payload.extendedBookingsDate;
      }

      expect(deliveryDocData).toEqual(
        expect.objectContaining({
          payload: expect.objectContaining({
            // To, form and bcc should be the same (created in test setup)
            from: setup.additionalSetup.emailFrom,
            to: saul.email,
            bcc: setup.additionalSetup.emailBcc,

            // We're using default templates for each email type and checking against interpolation values
            // provided in the test payload
            subject: interpolateText(
              defaultEmailTemplates[type].subject,
              interpolationValues
            ),
            html: interpolateText(
              defaultEmailTemplates[type].html,
              interpolationValues
            ),
          }),
        })
      );
    });
  });
};

describe("SendEmail", () =>
  runSendEmailTableTests([
    {
      type: EmailType.SendBookingsLink,
      payload: {
        bookingsLink: "https://eisbuk.com/bookings",
      },
    },
    {
      type: EmailType.SendCalendarFile,
      payload: {
        attachments: {
          filename: "calendar.ics",
          content: "calendar content",
        },
      },
    },
    {
      type: EmailType.SendExtendedBookingsDate,
      payload: {
        bookingsMonth: "2021-01",
        extendedBookingsDate: "2021-01-31",
      },
    },
  ]));

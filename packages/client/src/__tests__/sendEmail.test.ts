import { describe, expect, test } from "vitest";
import { httpsCallable } from "@firebase/functions";

import {
  ClientMessagePayload,
  ClientMessageType,
  interpolateText,
  defaultEmailTemplates as emailTemplates,
  EmailInterpolationValues,
  ClientMessageMethod,
} from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";

import { saul } from "@eisbuk/testing/customers";

import { setUpOrganization } from "@/__testSetup__/node";
import { adminDb, functions } from "@/__testSetup__/firestoreSetup";

type SendEmailTest =
  | {
      type: ClientMessageType.SendBookingsLink;
      payload: Pick<
        ClientMessagePayload<
          ClientMessageMethod.Email,
          ClientMessageType.SendBookingsLink
        >,
        "bookingsLink"
      >;
    }
  | {
      type: ClientMessageType.SendCalendarFile;
      payload: Pick<
        ClientMessagePayload<
          ClientMessageMethod.Email,
          ClientMessageType.SendCalendarFile
        >,
        "attachments"
      >;
    }
  | {
      type: ClientMessageType.SendExtendedBookingsDate;
      payload: Pick<
        ClientMessagePayload<
          ClientMessageMethod,
          ClientMessageType.SendExtendedBookingsDate
        >,
        "extendedBookingsDate" | "bookingsMonth"
      >;
    };

const orgSetup = {
  doLogin: true,
  setSecrets: true,
};

const emailSetup = {
  emailFrom: "eisbuk@email.com",
  emailBcc: "bcc@gmail.com",
};

/**
 * Runs table tests from the payload passed in (for each email type)
 * Unlike other table tests, the assertions are not in the payload, but rather
 * handled internally, by constructing the interpolation values and checking
 * against the default templates.
 */
const runSendEmailTableTests = (tests: SendEmailTest[]) => {
  tests.forEach(({ type, payload }) => {
    test(`should construct an email of type ${type} and hand it over for delivery`, async () => {
      const { organization } = await setUpOrganization({
        ...orgSetup,
        additionalSetup: emailSetup,
      });

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
      )({ type, ...payload, organization, ...saul });

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
      if (type === ClientMessageType.SendBookingsLink) {
        interpolationValues.bookingsLink = payload.bookingsLink;
      }

      // In case of send calendar file, add calendar file specific interpolation values
      if (type === ClientMessageType.SendCalendarFile) {
        interpolationValues.calendarFile = payload.attachments.filename;
      }

      // In case of send extended bookings date, add extended bookings date specific interpolation values
      if (type === ClientMessageType.SendExtendedBookingsDate) {
        interpolationValues.bookingsMonth = payload.bookingsMonth;
        interpolationValues.extendedBookingsDate = payload.extendedBookingsDate;
      }

      expect(deliveryDocData).toEqual(
        expect.objectContaining({
          payload: expect.objectContaining({
            // To, form and bcc should be the same (created in test setup)
            from: emailSetup.emailFrom,
            to: saul.email,
            bcc: emailSetup.emailBcc,

            // We're using default templates for each email type and checking against interpolation values
            // provided in the test payload
            subject: interpolateText(
              emailTemplates[type].subject,
              interpolationValues
            ),
            html: interpolateText(
              emailTemplates[type].html,
              interpolationValues
            ),
          }),
        })
      );
    });
  });
};

describe("SendEmail", () => {
  runSendEmailTableTests([
    {
      type: ClientMessageType.SendBookingsLink,
      payload: {
        bookingsLink: "https://eisbuk.com/bookings",
      },
    },
    {
      type: ClientMessageType.SendCalendarFile,
      payload: {
        attachments: {
          filename: "calendar.ics",
          content: "calendar content",
        },
      },
    },
    {
      type: ClientMessageType.SendExtendedBookingsDate,
      payload: {
        bookingsMonth: "2021-01",
        extendedBookingsDate: "2021-01-31",
      },
    },
  ]);

  test("should use 'emailNameFrom' (if available in org setup) as 'from' attribute", async () => {
    const additionalSetup = { ...emailSetup, emailNameFrom: "Eisbuk Team" };
    const { organization } = await setUpOrganization({
      ...orgSetup,
      additionalSetup,
    });

    const emailPayload = {
      ...saul,
      organization,
      type: ClientMessageType.SendBookingsLink,
      bookingsLink: "https://eisbuk.com/bookings",
    };

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
    )(emailPayload);

    expect(success).toEqual(true);

    // Check the process document
    const deliveryDocPath = deliveryDocumentPath;
    const deliveryDoc = await adminDb.doc(deliveryDocPath).get();
    const deliveryDocData = deliveryDoc.data();

    expect(deliveryDocData).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          // Using email name from instead of email from
          from: "Eisbuk Team",
          to: saul.email,
          bcc: emailSetup.emailBcc,
        }),
      })
    );
  });
});

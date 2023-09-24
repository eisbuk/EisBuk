import { describe, expect, test } from "vitest";
import { httpsCallable } from "@firebase/functions";

import {
  ClientMessagePayload,
  ClientMessageType,
  interpolateText,
  defaultSMSTemplates as smsTemplates,
  EmailInterpolationValues,
  ClientMessageMethod,
  OrganizationData,
} from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";

import { saul } from "@eisbuk/testing/customers";

import { setUpOrganization } from "@/__testSetup__/node";
import { adminDb, functions } from "@/__testSetup__/firestoreSetup";

type SendSMSTest =
  | {
      type: ClientMessageType.SendBookingsLink;
      payload: Pick<
        ClientMessagePayload<
          ClientMessageMethod.SMS,
          ClientMessageType.SendBookingsLink
        >,
        "bookingsLink"
      >;
    }
  | {
      type: ClientMessageType.SendExtendedBookingsDate;
      payload: Pick<
        ClientMessagePayload<
          ClientMessageMethod.SMS,
          ClientMessageType.SendExtendedBookingsDate
        >,
        "extendedBookingsDate" | "bookingsMonth"
      >;
    };

/**
 * Runs table tests from the payload passed in (for each email type)
 * Unlike other table tests, the assertions are not in the payload, but rather
 * handled internally, by constructing the interpolation values and checking
 * against the default templates.
 */
const runSendEmailTableTests = (tests: SendSMSTest[]) => {
  const setup = {
    doLogin: true,
    setSecrets: true,
    additionalSetup: {
      smsFrom: "Eisbuk",
    } as OrganizationData,
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
        CloudFunction.SendSMS
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

      // In case of send extended bookings date, add extended bookings date specific interpolation values
      if (type === ClientMessageType.SendExtendedBookingsDate) {
        interpolationValues.bookingsMonth = payload.bookingsMonth;
        interpolationValues.extendedBookingsDate = payload.extendedBookingsDate;
      }

      expect(deliveryDocData).toEqual(
        expect.objectContaining({
          payload: expect.objectContaining({
            to: saul.phone!,
            message: interpolateText(smsTemplates[type], interpolationValues),
          }),
        })
      );
    });
  });
};

describe("SendSMS", () =>
  runSendEmailTableTests([
    {
      type: ClientMessageType.SendBookingsLink,
      payload: {
        bookingsLink: "https://eisbuk.com/bookings",
      },
    },
    {
      type: ClientMessageType.SendExtendedBookingsDate,
      payload: {
        bookingsMonth: "2021-01",
        extendedBookingsDate: "2021-01-31",
      },
    },
  ]));

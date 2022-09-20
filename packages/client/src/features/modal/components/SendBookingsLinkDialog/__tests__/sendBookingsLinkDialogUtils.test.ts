import { OrgSubCollection, SMSMessage, EmailPayload } from "@eisbuk/shared";
import i18n, { NotificationMessage, Prompt } from "@eisbuk/translations";
import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";

import { getNewStore } from "@/store/createStore";

import { SendBookingLinkMethod } from "@/enums/other";
import { NotifVariant } from "@/enums/store";
import { Routes } from "@/enums/routes";
import { CloudFunction } from "@/enums/functions";

import { enqueueNotification } from "@/features/notifications/actions";

import { getBookingsLink, getDialogPrompt, sendBookingsLink } from "../utils";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { saul } from "@/__testData__/customers";
import { __testOrganization__ } from "@/__testSetup__/envData";

// #region getDialogPromptSetup
const testPhone = "12345";
const testEmail = "testio@test.com";

type TestParams = Parameters<typeof getDialogPrompt>[0] & {
  name: string;
  want: ReturnType<typeof getDialogPrompt>;
};

const runGetDialogTableTests = (tests: TestParams[]) =>
  tests.forEach(({ name, want, ...inputParams }) => {
    test(name, () => {
      expect(getDialogPrompt(inputParams)).toEqual(want);
    });
  });
// #endregion getDialogPromptSetup

// #region sendBookingsLinkSetup
// mocks we're using to test calling the right cloud function
// for 'sendBookingsLink'
const mockSendMail = jest.fn();
const mockSendSMS = jest.fn();
const mockCreateFunctionCaller = jest
  .fn()
  .mockImplementation((func, payload) =>
    func === CloudFunction.SendEmail
      ? () => mockSendMail(payload)
      : func === CloudFunction.SendSMS
      ? () => mockSendSMS(payload)
      : jest.fn()
  );
jest.mock("@/utils/firebase", () => ({
  createCloudFunctionCaller: (...params: any[]) =>
    mockCreateFunctionCaller(...params),
}));
// #endregion sendBookingsLinkSetup

describe("Send bookings link dialog utils", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getDialogPrompt", () =>
    runGetDialogTableTests([
      {
        name: "should display 'email' prompt for method = \"email\" when 'email' defined",
        method: SendBookingLinkMethod.Email,
        email: testEmail,
        want: {
          title: i18n.t(Prompt.SendEmailTitle),
          body: i18n.t(Prompt.ConfirmEmail, { email: testEmail }),
          disabled: false,
        },
      },
      {
        name: "should display 'sms' prompt for method = \"sms\" when 'phone' defined",
        method: SendBookingLinkMethod.SMS,
        phone: testPhone,
        want: {
          title: i18n.t(Prompt.SendSMSTitle),
          body: i18n.t(Prompt.ConfirmSMS, { phone: testPhone }),
          disabled: false,
        },
      },
      {
        name: "should display 'no-email' prompt and disable confirmation for method = \"email\" when 'email' undefined",
        method: SendBookingLinkMethod.Email,
        want: {
          title: i18n.t(Prompt.NoEmailTitle),
          body: i18n.t(Prompt.NoEmailMessage),
          disabled: true,
        },
      },
      {
        name: "should display 'no-sms' prompt and disable confirmation for method = \"sms\" when 'phone' undefined",
        method: SendBookingLinkMethod.SMS,
        want: {
          title: i18n.t(Prompt.NoPhoneTitle),
          body: i18n.t(Prompt.NoPhoneMessage),
          disabled: true,
        },
      },
    ]));

  describe("sendBookingsLink", () => {
    const mockDispatch = jest.fn();

    // bookings link we're using throughout
    const bookingsLink = `https://test-hostname.com${Routes.CustomerArea}/${saul.secretKey}`;

    // Create test store with the same state for all tests
    const store = getNewStore();
    store.dispatch(
      updateLocalDocuments(OrgSubCollection.Customers, { [saul.id]: saul })
    );
    const { getState } = store;

    testWithEmulator(
      "should call a mail sending cloud function if method = 'email'",
      async () => {
        await sendBookingsLink({
          ...saul,
          method: SendBookingLinkMethod.Email,
          bookingsLink,
          displayName: __testOrganization__,
        })(mockDispatch, getState);
        // check results
        expect(mockSendMail).toHaveBeenCalledTimes(1);
        const sentMail = mockSendMail.mock.calls[0][0] as EmailPayload;

        expect(sentMail.to).toEqual(saul.email);
        expect(sentMail.subject).toBeDefined();
        // we're not matching the complete html of message
        // but are asserting that it contains important parts
        expect(sentMail.html.includes(bookingsLink)).toBeTruthy();
        expect(sentMail.html.includes(saul.name)).toBeTruthy();

        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.EmailSent),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    testWithEmulator(
      "should call an SMS sending cloud function if method = 'sms'",
      async () => {
        await sendBookingsLink({
          ...saul,
          method: SendBookingLinkMethod.SMS,
          bookingsLink,
          displayName: __testOrganization__,
        })(mockDispatch, getState);
        // check results
        expect(mockSendSMS).toHaveBeenCalledTimes(1);
        const sentSMS = mockSendSMS.mock.calls[0][0] as SMSMessage;

        expect(sentSMS.to).toEqual(saul.phone);
        // we're not matching the complete html of message
        // but are asserting that it contains important parts
        expect(sentSMS.message.includes(bookingsLink)).toBeTruthy();
        expect(sentSMS.message.includes(saul.name)).toBeTruthy();
        // the sms should be clean, without markup
        expect(sentSMS.message.includes("p>")).toBeFalsy();

        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SMSSent),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    testWithEmulator(
      "should show error notification if function call unsuccessful",
      async () => {
        // intentionally cause error to test error handling
        mockCreateFunctionCaller.mockImplementation(() => {
          throw new Error();
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await sendBookingsLink({
          ...saul,
          method: SendBookingLinkMethod.Email,
          bookingsLink,
          displayName: __testOrganization__,
        })(mockDispatch, getState);
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.Error),
            variant: NotifVariant.Error,
          })
        );
      }
    );
  });

  describe("getBookingsLink", () => {
    test("should return a bookings link taking into account domain name and customer secretKey", () => {
      globalThis.window = { location: { host: "eisbuk.com" } } as any;
      const res = getBookingsLink("test-secret-key");
      expect(res).toEqual("https://eisbuk.com/customer_area/test-secret-key");
    });
  });
});

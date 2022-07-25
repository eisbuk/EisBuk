import { OrgSubCollection, SMSMessage, EmailPayload } from "@eisbuk/shared";
import i18n, { NotificationMessage, Prompt } from "@eisbuk/translations";
import { updateLocalDocuments } from "@/react-redux-firebase/actions";

import { getNewStore } from "@/store/createStore";

import { SendBookingLinkMethod } from "@/enums/other";
import { Action, NotifVariant } from "@/enums/store";
import { Routes } from "@/enums/routes";
import { CloudFunction } from "@/enums/functions";

import * as appActions from "@/store/actions/appActions";

import { getBookingsLink, getDialogPrompt, sendBookingsLink } from "../utils";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { saul } from "@/__testData__/customers";

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
    /** The following @TEMP until we migrate the notifications logic the a new one */
    // #region veryTEMP
    /**
     * Mock `enqueueSnackbar` implementation for easier testing.
     * Here we're using the same implmentation as the original function (action creator),
     * only omitting the notification key (as this is simpler)
     */
    const mockEnqueueSnackbar = ({
      // we're omitting the key as it is, in most cases, signed with date and random number
      // and this is easier than mocking `Date` object to always return the same value
      // and seeding random to given value
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      key,
      ...notification
    }: Parameters<typeof appActions.enqueueNotification>[0]) => ({
      type: Action.EnqueueNotification,
      payload: { ...notification },
    });
    // mock `enqueueSnackbar` in component
    jest
      .spyOn(appActions, "enqueueNotification")
      .mockImplementation(mockEnqueueSnackbar as any);
    // #region veryTEMP

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
        })(mockDispatch, getState);
        // check results
        expect(mockSendMail).toHaveBeenCalledTimes(1);
        const sentMail = mockSendMail.mock.calls[0][0] as EmailPayload;

        expect(sentMail.to).toEqual(saul.email);
        expect(sentMail.message.subject).toBeDefined();
        // we're not matching the complete html of message
        // but are asserting that it contains important parts
        expect(sentMail.message.html.includes(bookingsLink)).toBeTruthy();
        expect(sentMail.message.html.includes(saul.name)).toBeTruthy();

        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          mockEnqueueSnackbar({
            message: i18n.t(NotificationMessage.EmailSent),
            closeButton: true,
            options: {
              variant: NotifVariant.Success,
            },
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
          mockEnqueueSnackbar({
            message: i18n.t(NotificationMessage.SMSSent),
            closeButton: true,
            options: {
              variant: NotifVariant.Success,
            },
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
        })(mockDispatch, getState);
        expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
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
import { describe, vi, expect, test, afterEach } from "vitest";
import { getFirestore as getClientFirestore } from "@firebase/firestore";

import {
  ClientMessageType,
  OrgSubCollection,
  ClientMessageMethod,
} from "@eisbuk/shared";
import { CloudFunction, Routes } from "@eisbuk/shared/ui";
import i18n, { NotificationMessage, Prompt } from "@eisbuk/translations";
import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";

import { getNewStore } from "@/store/createStore";

import { NotifVariant } from "@/enums/store";

import { enqueueNotification } from "@/features/notifications/actions";

import { getBookingsLink, getDialogPrompt, sendBookingsLink } from "../utils";
import { FirestoreVariant } from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { saul } from "@eisbuk/testing/customers";
import { runThunk } from "@/__testUtils__/helpers";

const getFirestore = () =>
  FirestoreVariant.client({ instance: getClientFirestore() });

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
const mockSendMail = vi.fn();
const mockSendSMS = vi.fn();
const mockCallFunction = vi
  .fn()
  .mockImplementation((_, func, payload) =>
    func === CloudFunction.SendEmail
      ? () => mockSendMail(payload)
      : func === CloudFunction.SendSMS
      ? () => mockSendSMS(payload)
      : vi.fn()
  );
vi.mock("@/utils/firebase", () => ({
  createFunctionCaller: (...params: any[]) => mockCallFunction(...params),
}));
// #endregion sendBookingsLinkSetup

describe("Send bookings link dialog utils", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getDialogPrompt", () =>
    runGetDialogTableTests([
      {
        name: "should display 'email' prompt for method = \"email\" when 'email' defined",
        method: ClientMessageMethod.Email,
        email: testEmail,
        want: {
          title: i18n.t(Prompt.SendEmailTitle),
          body: i18n.t(Prompt.ConfirmEmail, { email: testEmail }),
          disabled: false,
        },
      },
      {
        name: "should display 'sms' prompt for method = \"sms\" when 'phone' defined",
        method: ClientMessageMethod.SMS,
        phone: testPhone,
        want: {
          title: i18n.t(Prompt.SendSMSTitle),
          body: i18n.t(Prompt.ConfirmSMS, { phone: testPhone }),
          disabled: false,
        },
      },
      {
        name: "should display 'no-email' prompt and disable confirmation for method = \"email\" when 'email' undefined",
        method: ClientMessageMethod.Email,
        want: {
          title: i18n.t(Prompt.NoEmailTitle),
          body: i18n.t(Prompt.NoEmailMessage),
          disabled: true,
        },
      },
      {
        name: "should display 'no-sms' prompt and disable confirmation for method = \"sms\" when 'phone' undefined",
        method: ClientMessageMethod.SMS,
        want: {
          title: i18n.t(Prompt.NoPhoneTitle),
          body: i18n.t(Prompt.NoPhoneMessage),
          disabled: true,
        },
      },
    ]));

  describe("sendBookingsLink", () => {
    const mockDispatch = vi.fn();
    vi.doMock("react-redux", () => ({
      useDispatch: () => mockDispatch,
    }));

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
        const testThunk = sendBookingsLink({
          ...saul,
          method: ClientMessageMethod.Email,
          bookingsLink,
        });
        await runThunk(testThunk, mockDispatch, getState, { getFirestore });
        // check results
        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(mockSendMail).toHaveBeenCalledWith({
          bookingsLink,
          email: saul.email,
          name: saul.name,
          surname: saul.surname,
          type: ClientMessageType.SendBookingsLink,
        });
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
        const testThunk = sendBookingsLink({
          ...saul,
          method: ClientMessageMethod.SMS,
          bookingsLink,
        });
        await runThunk(testThunk, mockDispatch, getState, {
          getFirestore,
        });
        // check results
        expect(mockSendSMS).toHaveBeenCalledTimes(1);
        expect(mockSendSMS).toHaveBeenCalledWith({
          bookingsLink,
          phone: saul.phone,
          name: saul.name,
          surname: saul.surname,
          type: ClientMessageType.SendBookingsLink,
        });

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
        mockCallFunction.mockImplementation(() => {
          throw new Error();
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const testThunk = sendBookingsLink({
          ...saul,
          method: ClientMessageMethod.Email,
          bookingsLink,
        });
        await runThunk(testThunk, mockDispatch, getState, { getFirestore });
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

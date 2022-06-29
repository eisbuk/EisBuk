/**
 * @jest-environment node
 */

import * as firestore from "@firebase/firestore";
import { getDocs, collection, doc, getDoc } from "@firebase/firestore";

import {
  Customer,
  Category,
  EmailMessage,
  SMSMessage,
  OrgSubCollection,
} from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import "@/__testSetup__/firestoreSetup";
import { getTestEnv } from "@/__testSetup__/firestore";

import { getNewStore } from "@/store/createStore";

import * as getters from "@/lib/getters";

import { Action, NotifVariant } from "@/enums/store";
import { Routes } from "@/enums/routes";
import { SendBookingLinkMethod } from "@/enums/other";
import { CloudFunction } from "@/enums/functions";

import {
  deleteCustomer,
  extendBookingDate,
  sendBookingsLink,
  updateCustomer,
} from "../customerOperations";
import * as appActions from "../appActions";

import { getCustomersPath } from "@/utils/firestore";
import * as firebaseUtils from "@/utils/firebase";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { stripIdAndSecretKey } from "@/__testUtils__/customers";
import { setupTestCustomer } from "../__testUtils__/firestore";

import { saul } from "@/__testData__/customers";
import { updateLocalDocuments } from "@/react-redux-firebase/actions";

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

const mockDispatch = jest.fn();

/**
 * A dummy function passed in place of `getState` to our thunk.
 * Customer operation thunks don't use the `getState` so we're passing this just
 * for function arg structure integrity
 * @returns empty object
 */
const getState = () => ({} as any);

const getFirestoreSpy = jest.spyOn(firestore, "getFirestore");
const getOrganizationSpy = jest.spyOn(getters, "getOrganization");

describe("customerOperations", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("updateCustomer", () => {
    testWithEmulator(
      "should create a new entry in 'customers' collection (with server assigned id)",
      async () => {
        const { db, organization } = await getTestEnv({});
        const noIdSaul = stripIdAndSecretKey(saul);
        // make sure tests are ran against test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
        // make sure that the db used by the thunk is test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk with customer data
        await updateCustomer(noIdSaul)(mockDispatch, getState);
        const customersRef = collection(db, getCustomersPath(organization));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { secretKey, id, ...saulInDb } = (
          await getDocs(customersRef)
        ).docs[0].data();
        expect(saulInDb).toEqual(noIdSaul);
        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          mockEnqueueSnackbar({
            message: `${saul.name} ${saul.surname} ${i18n.t(
              NotificationMessage.Updated
            )}`,
            closeButton: true,
            options: {
              variant: NotifVariant.Success,
            },
          })
        );
      }
    );

    testWithEmulator(
      "should update existing customer in database",
      async () => {
        // setup test state
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestCustomer({
              customer: saul,
              store,
              db,
              organization,
            }),
        });
        // make sure tests are ran against test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
        // make sure that the db used by the thunk is test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // create a thunk with updated customer data
        const saulDocRef = doc(db, getCustomersPath(organization), saul.id);
        const saulInDb = (await getDoc(saulDocRef)).data() as Customer;
        const updatedSaul = { ...saulInDb, category: Category.CourseAdults };
        const testThunk = updateCustomer(updatedSaul);
        // run the thunk with mocked data
        await testThunk(store.dispatch, store.getState);
        const updatedSaulInDb = (await getDoc(saulDocRef)).data() as Customer;
        expect(updatedSaulInDb).toEqual(updatedSaul);
      }
    );

    testWithEmulator("error", async () => {
      // intentionally cause error
      getFirestoreSpy.mockImplementation(() => {
        throw new Error();
      });
      // run thunk
      const testThunk = updateCustomer(saul);
      await testThunk(mockDispatch, getState);
      // check err snackbar being called
      expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
    });
  });

  describe("deleteCustomer", () => {
    testWithEmulator(
      "should delete existing customer in database",
      async () => {
        // setup test state
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestCustomer({
              customer: saul,
              store,
              db,
              organization,
            }),
        });
        // make sure tests are ran against test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
        // make sure that the db used by the thunk is test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk with updated customer data
        await deleteCustomer(saul)(mockDispatch, store.getState);
        const saulDocRef = doc(db, getCustomersPath(organization), saul.id);
        const deletedSaul = (await getDoc(saulDocRef)).data() as Customer;
        expect(deletedSaul).toEqual({
          ...saul,
          deleted: true,
        });
        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          mockEnqueueSnackbar({
            message: `${saul.name} ${saul.surname} ${i18n.t(
              NotificationMessage.Removed
            )}`,
            closeButton: true,
            options: {
              variant: NotifVariant.Success,
            },
          })
        );
      }
    );

    testWithEmulator("error", async () => {
      // intentionally cause error
      getFirestoreSpy.mockImplementation(() => {
        throw new Error();
      });
      // run thunk
      await deleteCustomer(saul)(mockDispatch, getState);
      // check err snackbar being called
      expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
    });
  });

  describe("sendBookingsLink", () => {
    // bookings link we're using throughout
    const bookingsLink = `https://test-hostname.com${Routes.CustomerArea}/${saul.secretKey}`;

    // Create test store with the same state for all tests
    const store = getNewStore();
    store.dispatch(
      updateLocalDocuments(OrgSubCollection.Customers, { [saul.id]: saul })
    );
    const { getState } = store;

    // mocks we're using to test calling the right cloud function
    const mockSendMail = jest.fn();
    const mockSendSMS = jest.fn();
    jest
      .spyOn(firebaseUtils, "createCloudFunctionCaller")
      .mockImplementation((func, payload) =>
        func === CloudFunction.SendEmail
          ? () => mockSendMail(payload)
          : func === CloudFunction.SendSMS
          ? () => mockSendSMS(payload)
          : jest.fn()
      );

    testWithEmulator(
      "should call a mail sending cloud function if method = 'email'",
      async () => {
        await sendBookingsLink({
          customerId: saul.id,
          method: SendBookingLinkMethod.Email,
          bookingsLink,
        })(mockDispatch, getState);
        // check results
        expect(mockSendMail).toHaveBeenCalledTimes(1);
        const sentMail = mockSendMail.mock.calls[0][0] as EmailMessage;

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
          customerId: saul.id,
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
        const getState = () => {
          throw new Error();
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await sendBookingsLink({
          customerId: saul.id,
          method: SendBookingLinkMethod.Email,
          bookingsLink,
        })(mockDispatch, getState);
        expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
      }
    );
  });

  describe("extendBookingDate", () => {
    testWithEmulator(
      "should add appropriate 'extendedDate' to the customer structure and show success notification",
      async () => {
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestCustomer({ db, store, customer: saul, organization }),
        });
        // verify that the customer doesn't have an extended date
        const customerInStore =
          store.getState().firestore.data.customers![saul.id];
        expect(customerInStore.extendedDate).toBeFalsy();
        // create and run the thunk
        const extendedDate = "2022-01-01";
        // make sure tests are ran against test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
        // make sure that the db used by the thunk is test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        await extendBookingDate(saul.id, extendedDate)(
          mockDispatch,
          () => ({} as any)
        );
        // exteneded date should be created in `customers` entry
        const updatedCustomer = await getDoc(
          doc(db, getCustomersPath(organization), saul.id)
        );
        const data = updatedCustomer.data();
        expect(data!.extendedDate).toEqual(extendedDate);
        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          mockEnqueueSnackbar({
            message: i18n.t(NotificationMessage.BookingDateExtended),
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
        getFirestoreSpy.mockImplementation = () => {
          console.log("this ran");
          throw new Error();
        };
        await extendBookingDate(saul.id, "2022-01-01")(
          mockDispatch,
          () => ({} as any)
        );
        expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
      }
    );
  });
});

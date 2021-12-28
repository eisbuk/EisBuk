import * as firestore from "@firebase/firestore";
import { getDocs, collection, doc, getDoc } from "@firebase/firestore";

import {
  Collection,
  Customer,
  OrgSubCollection,
  Category,
} from "eisbuk-shared";

import { Action, NotifVariant } from "@/enums/store";

import { db, adminDb } from "@/__testSetup__/firestoreSetup";
import { __organization__ } from "@/lib/constants";

import { NotificationMessage } from "@/enums/translations";

import {
  deleteCustomer,
  sendBookingsLink,
  updateCustomer,
} from "../customerOperations";
import * as appActions from "../appActions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { createTestStore, deleteAll } from "@/__testUtils__/firestore";
import { waitForCondition } from "@/__testUtils__/helpers";
import { stripIdAndSecretKey } from "@/__testUtils__/customers";
import { setupTestCustomer } from "../__testUtils__/firestore";
import i18n from "@/__testUtils__/i18n";

import { saul } from "@/__testData__/customers";
import { loginDefaultUser } from "@/__testUtils__/auth";

const customersPath = `${Collection.Organizations}/${__organization__}/${OrgSubCollection.Customers}`;

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

/**
 * A mock function we're passing as `dispatch` to thunk in order
 * to test appropriate actions being dispatched to the store
 */
const mockDispatch = jest.fn();

/**
 * A dummy function passed in place of `getState` to our thunk.
 * Customer operation thunks don't use the `getState` so we're passing this just
 * for function arg structure integrity
 * @returns empty object
 */
const getState = () => ({} as any);

/**
 * A spy of `getFirebase` function which we're occasionally mocking to throw error
 * for error handling tests
 */
const getFirebaseSpy = jest.spyOn(firestore, "getFirestore");

describe("customerOperations", () => {
  beforeEach(async () => {
    await deleteAll();
    await loginDefaultUser();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("updateCustomer", () => {
    testWithEmulator(
      "should create a new entry in 'customers' collection (with server assigned id)",
      async () => {
        const noIdSaul = stripIdAndSecretKey(saul);
        // create a thunk curried with customer data
        const testThunk = updateCustomer(noIdSaul);
        // run the thunk with mocked data
        await testThunk(mockDispatch, getState);
        const customersRef = collection(db, customersPath);
        const { id: saulId } = (await getDocs(customersRef)).docs[0];
        // wait for data triggers to run
        const saulFromDb = (await waitForCondition({
          documentPath: `${customersPath}/${saulId}`,
          condition: (data) => data && data.secretKey && data.id,
        })) as Customer;
        expect(saulFromDb).toEqual({
          ...noIdSaul,
          id: saulId,
          // we're just copying a server generated secret key
          secretKey: saulFromDb.secretKey,
        });
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
        // we're just stripping secret key (and letting it be generated by the server)
        const existingSaul = { ...stripIdAndSecretKey(saul), id: saul.id };
        // set up test state
        const thunkArgs = await setupTestCustomer({
          customer: existingSaul,
          dispatch: mockDispatch,
        });
        // create a thunk with updated customer data
        const saulDocRef = doc(db, customersPath, saul.id);
        const saulInDb = (await getDoc(saulDocRef)).data() as Customer;
        const updatedSaul = { ...saulInDb, category: Category.Course };
        const testThunk = updateCustomer(updatedSaul);
        // run the thunk with mocked data
        await testThunk(...thunkArgs);
        const updatedSaulInDb = (await getDoc(saulDocRef)).data() as Customer;
        expect(updatedSaulInDb).toEqual(updatedSaul);
      }
    );

    testWithEmulator("error", async () => {
      // intentionally cause error
      getFirebaseSpy.mockImplementationOnce(() => {
        throw new Error();
      });
      // run thunk
      const thunkArgs = await setupTestCustomer({
        customer: saul,
        dispatch: mockDispatch,
      });
      const testThunk = updateCustomer(saul);
      await testThunk(...thunkArgs);
      // check err snackbar being called
      expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
    });
  });

  describe("deleteCustomer", () => {
    testWithEmulator(
      "should delete existing customer in database",
      async () => {
        // we're just stripping secret key (and letting it be generated by the server)
        const existingSaul = { ...stripIdAndSecretKey(saul), id: saul.id };
        // set up test state
        const thunkArgs = await setupTestCustomer({
          customer: existingSaul,
          dispatch: mockDispatch,
        });
        // create a thunk with updated customer data
        const testThunk = deleteCustomer(saul);
        // run the thunk with mocked data
        await testThunk(...thunkArgs);
        const saulDocRef = doc(db, customersPath, saul.id);
        const { secretKey, ...deletedSaul } = (
          await getDoc(saulDocRef)
        ).data() as Customer;
        expect({ secretKey, ...deletedSaul }).toEqual({
          ...saul,
          secretKey,
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
      getFirebaseSpy.mockImplementationOnce(() => {
        throw new Error();
      });
      // run thunk
      const thunkArgs = await setupTestCustomer({
        customer: saul,
        dispatch: mockDispatch,
      });
      const testThunk = deleteCustomer(saul);
      await testThunk(...thunkArgs);
      // check err snackbar being called
      expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
    });
  });

  describe("sendBookingsLink", () => {
    // test state for all tests
    const getState = () =>
      createTestStore({
        data: {
          customers: {
            [saul.id]: saul,
          },
        },
      });

    testWithEmulator(
      "should queue the right mail to email queue in firestore and show success notification",
      async () => {
        await sendBookingsLink(saul.id)(mockDispatch, getState);
        // check results
        const mailQueue = await adminDb.collection(Collection.EmailQueue).get();
        expect(mailQueue.docs.length).toEqual(1);
        const sentMail = mailQueue.docs[0].data();
        expect(sentMail.to).toEqual(saul.email);
        expect(sentMail.message.subject).toBeDefined();
        // we're not matching the complete html of message
        // but are asserting that it contains important parts
        const bookingLink = `https://localhost/customer_area/${saul.secretKey}`;
        expect(sentMail.message.html.includes(bookingLink)).toBeTruthy();
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
      "should show error notification if function call unsuccessful",
      async () => {
        // intentionally cause error to test error handling
        const getState = () => {
          throw new Error();
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await sendBookingsLink(saul.id)(mockDispatch, getState);
        expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
      }
    );
  });
});

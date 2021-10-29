import { testWithEmulator } from "@/__testUtils__/envUtils";

import {
  Collection,
  Customer,
  OrgSubCollection,
  Category,
} from "eisbuk-shared";

import { NotificationMessage } from "@/lib/notifications";

import { Action, NotifVariant } from "@/enums/store";

import { adminDb } from "@/tests/settings";
import { ORGANIZATION } from "@/config/envInfo";

import { deleteCustomer, updateCustomer } from "../customerOperations";
import * as appActions from "../appActions";

import { deleteAll } from "@/tests/utils";
import { getFirebase } from "@/__testUtils__/firestore";
import { stripIdAndSecretKey, waitForCondition } from "@/__testUtils__/helpers";
import { setupTestCustomer } from "../__testUtils__/firestore";
import * as firestoreUtils from "@/__testUtils__/firestore";

import { saul } from "@/__testData__/customers";

const customersRef = adminDb
  .collection(Collection.Organizations)
  .doc(ORGANIZATION)
  .collection(OrgSubCollection.Customers);

const customersPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Customers}`;

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
const getFirebaseSpy = jest.spyOn(firestoreUtils, "getFirebase");

// we're mocking `t` from `i18next` to be an identity function for easier testing
jest.mock("i18next", () => ({
  t: (label: string) => label,
}));

describe("customerOperations", () => {
  afterEach(async () => {
    await deleteAll([OrgSubCollection.Customers]);
  });

  describe("updateCustomer", () => {
    testWithEmulator(
      "should create a new entry in 'customers' collection (with server assigned id)",
      async () => {
        const noIdSaul = stripIdAndSecretKey(saul);
        // create a thunk curried with customer data
        const testThunk = updateCustomer(noIdSaul);
        // run the thunk with mocked data
        await testThunk(mockDispatch, getState, { getFirebase });
        const { id: saulId } = (await customersRef.get()).docs[0];
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
            message: `${saul.name} ${saul.surname} ${NotificationMessage.Updated}`,
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
        const saulInDb = (
          await customersRef.doc(saul.id).get()
        ).data() as Customer;
        const updatedSaul = { ...saulInDb, category: Category.Course };
        const testThunk = updateCustomer(updatedSaul);
        // run the thunk with mocked data
        await testThunk(...thunkArgs);
        const updatedSaulInDb = (
          await customersRef.doc(saul.id).get()
        ).data() as Customer;
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
        const testThunk = deleteCustomer(saul);
        // run the thunk with mocked data
        await testThunk(...thunkArgs);
        const { secretKey, ...deletedSaul } = (
          await customersRef.doc(saul.id).get()
        ).data() as Customer;
        expect({ secretKey, ...deletedSaul }).toEqual({
          ...saul,
          secretKey,
          deleted: true,
        });
        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          mockEnqueueSnackbar({
            message: `${saul.name} ${saul.surname} ${NotificationMessage.Removed}`,
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
});

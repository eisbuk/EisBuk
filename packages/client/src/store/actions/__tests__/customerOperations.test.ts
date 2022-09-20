/**
 * @jest-environment node
 */

import * as firestore from "@firebase/firestore";
import { getDocs, collection, doc, getDoc } from "@firebase/firestore";

import { Customer, Category } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import "@/__testSetup__/firestoreSetup";
import { getTestEnv } from "@/__testSetup__/firestore";

import { getNewStore } from "@/store/createStore";

import * as getters from "@/lib/getters";

import { NotifVariant } from "@/enums/store";

import {
  deleteCustomer,
  extendBookingDate,
  updateCustomer,
} from "../customerOperations";
import { enqueueNotification } from "@/features/notifications/actions";

import { getCustomersPath } from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { stripIdAndSecretKey } from "@/__testUtils__/customers";
import { setupTestCustomer } from "../__testUtils__/firestore";

import { saul } from "@/__testData__/customers";

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
          enqueueNotification({
            message: `${saul.name} ${saul.surname} ${i18n.t(
              NotificationMessage.Updated
            )}`,
            variant: NotifVariant.Success,
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
        const updatedSaul = {
          ...saulInDb,
          categories: [Category.CourseAdults],
        };
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
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
        })
      );
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
          enqueueNotification({
            message: `${saul.name} ${saul.surname} ${i18n.t(
              NotificationMessage.Removed
            )}`,
            variant: NotifVariant.Success,
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
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
        })
      );
    });
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
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingDateExtended),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    testWithEmulator(
      "should show error notification if function call unsuccessful",
      async () => {
        // intentionally cause error to test error handling
        getFirestoreSpy.mockImplementation = () => {
          throw new Error();
        };
        await extendBookingDate(saul.id, "2022-01-01")(
          mockDispatch,
          () => ({} as any)
        );
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.Error),
            variant: NotifVariant.Error,
          })
        );
      }
    );
  });
});

/**
 * @vitest-environment node
 */

import { describe, vi, expect, afterEach } from "vitest";

import { Customer, Category } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { saul } from "@eisbuk/testing/customers";

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

import {
  getCustomersPath,
  getDocs,
  collection,
  doc,
  getDoc,
} from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { stripIdAndSecretKey } from "@/__testUtils__/customers";
import { setupTestCustomer } from "../__testUtils__/firestore";
import { runThunk } from "@/__testUtils__/helpers";

const mockDispatch = vi.fn();

/**
 * A dummy function passed in place of `getState` to our thunk.
 * Customer operation thunks don't use the `getState` so we're passing this just
 * for function arg structure integrity
 * @returns empty object
 */
const getState = () => ({} as any);

const getOrganizationSpy = vi.spyOn(getters, "getOrganization");

describe("customerOperations", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
        const getFirestore = () => db as any;
        // run the thunk with customer data
        const testThunk = updateCustomer(noIdSaul);
        await runThunk(testThunk, mockDispatch, getState, {
          getFirestore,
        });
        const customersRef = collection(db, getCustomersPath(organization));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { secretKey, id, ...saulInDb } = (
          await getDocs(customersRef)
        ).docs[0].data();
        expect(saulInDb).toEqual(noIdSaul);
        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.CustomerUpdated, {
              name: saul.name,
              surname: saul.surname,
            }),
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
        const getFirestore = () => db as any;
        // create a thunk with updated customer data
        const saulDocRef = doc(db, getCustomersPath(organization), saul.id);
        const saulInDb = (await getDoc(saulDocRef)).data() as Customer;
        const updatedSaul = {
          ...saulInDb,
          categories: [Category.CourseAdults],
        };
        const testThunk = updateCustomer(updatedSaul);
        // run the thunk with mocked data
        await runThunk(testThunk, store.dispatch, store.getState, {
          getFirestore,
        });
        const updatedSaulInDb = (await getDoc(saulDocRef)).data() as Customer;
        expect(updatedSaulInDb).toEqual(updatedSaul);
      }
    );

    testWithEmulator("error", async () => {
      // intentionally cause error
      const testError = new Error("test");
      const getFirestore = () => {
        throw testError;
      };
      // run thunk
      const testThunk = updateCustomer(saul);
      await runThunk(testThunk, mockDispatch, getState, { getFirestore });
      // check err snackbar being called
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.CustomerUpdateError, {
            name: saul.name,
            surname: saul.surname,
          }),
          variant: NotifVariant.Error,
          error: testError,
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
        const getFirestore = () => db;
        // run the thunk with updated customer data
        const testThunk = deleteCustomer(saul);
        await runThunk(testThunk, mockDispatch, store.getState, {
          getFirestore,
        });
        const saulDocRef = doc(db, getCustomersPath(organization), saul.id);
        const deletedSaul = (await getDoc(saulDocRef)).data() as Customer;
        expect(deletedSaul).toEqual({
          ...saul,
          deleted: true,
        });
        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.CustomerDeleted, {
              name: saul.name,
              surname: saul.surname,
            }),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    testWithEmulator("error", async () => {
      // intentionally cause error
      const testError = new Error("test");
      const getFirestore = () => {
        throw testError;
      };
      // run thunk
      const testThunk = deleteCustomer(saul);
      await runThunk(testThunk, mockDispatch, getState, { getFirestore });
      // check err snackbar being called
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.CustomerDeleteError, {
            name: saul.name,
            surname: saul.surname,
          }),
          variant: NotifVariant.Error,
          error: testError,
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
        const getFirestore = () => db;
        const testThunk = extendBookingDate(saul, extendedDate);
        await runThunk(testThunk, mockDispatch, () => ({} as any), {
          getFirestore,
        });
        // exteneded date should be created in `customers` entry
        const updatedCustomer = await getDoc(
          doc(db, getCustomersPath(organization), saul.id)
        );
        const data = updatedCustomer.data();
        expect(data!.extendedDate).toEqual(extendedDate);
        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingDateExtended, {
              name: saul.name,
              surname: saul.surname,
            }),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    testWithEmulator(
      "should show error notification if function call unsuccessful",
      async () => {
        // intentionally cause error to test error handling
        const testError = new Error("test");
        const getFirestore = () => {
          throw testError;
        };
        const testThunk = extendBookingDate(saul, "2022-01-01");
        runThunk(testThunk, mockDispatch, () => ({} as any), { getFirestore });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingDateExtendedError, {
              name: saul.name,
              surname: saul.surname,
            }),
            variant: NotifVariant.Error,
            error: testError,
          })
        );
      }
    );
  });
});

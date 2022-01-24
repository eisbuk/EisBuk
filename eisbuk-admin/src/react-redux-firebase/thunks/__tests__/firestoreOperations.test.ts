import { cleanup } from "@testing-library/react";

import { OrgSubCollection } from "eisbuk-shared";

import { addFirestoreListener, removeFirestoreListener } from "../index";
import { updateFirestoreListener } from "@/react-redux-firebase/actions";

import { getNewStore } from "@/store/createStore";

import { getFirestoreListeners } from "@/react-redux-firebase/selectors";
import { getCustomersRecord } from "@/store/selectors/customers";

import { isEmpty } from "@/utils/helpers";

/**
 * A test consumer id we're using as id of a "hook" calling to the add/remove listener
 */
const consumerId = "subscribe-hook-1";
/**
 * Another consumer we're using when testing for consumers, other
 * than test consumer, being present
 */
const dummyConsumerId = "some-other-consumer";

describe("Firestore subscriptions", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("addFirestoreListener", () => {
    test("should create a new listener, if no listener registered for a particular collection", async () => {
      const { dispatch, getState } = getNewStore();
      await addFirestoreListener(
        {
          storeAs: OrgSubCollection.Customers,
          collPath: "",
          constraint: null,
        },
        consumerId
      )(dispatch, getState);

      const listeners = getFirestoreListeners(getState());
      expect(listeners[OrgSubCollection.Customers]?.consumers).toEqual([
        consumerId,
      ]);
    });

    test("should add consumer to consumers list of appropriate listener record, if the listener for a collection already exists", async () => {
      // set up test state
      const { dispatch, getState } = getNewStore();
      dispatch(
        updateFirestoreListener(OrgSubCollection.Customers, {
          consumers: [dummyConsumerId],
        })
      );
      // run the thunk
      await addFirestoreListener(
        {
          storeAs: OrgSubCollection.Customers,
          collPath: "",
          constraint: null,
        },
        consumerId
      )(dispatch, getState);

      const listeners = getFirestoreListeners(getState());
      expect(listeners[OrgSubCollection.Customers]?.consumers).toEqual([
        dummyConsumerId,
        consumerId,
      ]);
    });
  });

  describe("removeFirestoreListener", () => {
    test("should remove a consumer from consumers list of a listener, if other consumer are registered", async () => {
      // set up test state
      const { dispatch, getState } = getNewStore();
      dispatch(
        updateFirestoreListener(OrgSubCollection.Customers, {
          consumers: [dummyConsumerId, consumerId],
        })
      );
      // run the thunk
      await removeFirestoreListener(OrgSubCollection.Customers, consumerId)(
        dispatch,
        getState
      );

      const listeners = getFirestoreListeners(getState());
      expect(listeners[OrgSubCollection.Customers]?.consumers).toEqual([
        dummyConsumerId,
      ]);
    });

    test("should run unsubscribe function and remove the listener (and subscribed data) from the store, if the current consumer is the last one for the listener", async () => {
      // set up test state
      const mockUnsubscribe = jest.fn();
      const { dispatch, getState } = getNewStore();
      dispatch(
        updateFirestoreListener(OrgSubCollection.Customers, {
          consumers: [consumerId],
          unsubscribe: mockUnsubscribe,
        })
      );
      // run the thunk
      await removeFirestoreListener(OrgSubCollection.Customers, consumerId)(
        dispatch,
        getState
      );

      expect(mockUnsubscribe).toHaveBeenCalled();
      const listeners = getFirestoreListeners(getState());
      expect(listeners[OrgSubCollection.Customers]).toBeFalsy();
      const customersInStore = getCustomersRecord(getState());
      expect(isEmpty(customersInStore)).toEqual(true);
    });
  });
});

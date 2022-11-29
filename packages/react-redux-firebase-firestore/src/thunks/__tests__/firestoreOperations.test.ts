import { cleanup } from "@testing-library/react";

import { OrgSubCollection } from "@eisbuk/shared";

import { GlobalStateFragment } from "../../types";

import { addFirestoreListener, removeFirestoreListener } from "../index";
import { updateFirestoreListener } from "../../actions";

import { getTestStore } from "../../__testUtils__/store";

import { getFirestoreListeners } from "../../selectors";

import { isEmpty } from "../../utils/helpers";

const getCustomersRecord = (state: GlobalStateFragment) =>
  state.firestore.data?.customers || {};

/**
 * A test consumer id we're using as id of a "hook" calling to the add/remove listener
 */
const consumerId = "subscribe-hook-1";
/**
 * Another consumer we're using when testing for consumers, other
 * than test consumer, being present
 */
const dummyConsumerId = "some-other-consumer";

// We're mocking a thunk calling out to firestore
// which we're not currently testing and would produce problems
// of firebase app not being initialised
jest.mock("../subscribe", () => ({
  // The function in question is a HOF returning a thunk,
  // therefore, the mock needs to return a function returning a promise
  updateSubscription: () => () => Promise.resolve(),
}));

describe("Firestore subscriptions", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("addFirestoreListener", () => {
    test("should create a new listener, if no listener registered for a particular collection", async () => {
      const { dispatch, getState } = getTestStore();
      await addFirestoreListener(
        {
          storeAs: OrgSubCollection.Customers,
          collPath: "",
          constraint: null,
          meta: {} as any,
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
      const { dispatch, getState } = getTestStore();
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
          meta: {} as any,
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
      const { dispatch, getState } = getTestStore();
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
      const { dispatch, getState } = getTestStore();
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

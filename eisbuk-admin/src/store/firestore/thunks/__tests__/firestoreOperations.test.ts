import "regenerator-runtime/runtime";
import { DateTime } from "luxon";
import { cleanup } from "@testing-library/react";

import { OrgSubCollection } from "eisbuk-shared";

import * as firestoreSubscriptions from "../handlers";
import { addFirestoreListener, removeFirestoreListener } from "../index";
import {
  deleteFirestoreListener,
  updateFirestoreListener,
} from "../../actions";

import { CollectionSubscription, FirestoreListener } from "@/types/store";

import { createTestStore } from "@/__testUtils__/firestore";

import { testDateLuxon } from "@/__testData__/date";

/**
 * A mock we're using to test dispatching to the store
 */
const mockDispatch = jest.fn();

/**
 * A mock implementation for our `subscribe` function. We're mocking it to
 * a sort of identity function, to test it being called with proper args.
 */
const mockSubscribeImplementation = ({
  coll,
  currentDate,
}: {
  coll: CollectionSubscription;
  currentDate: DateTime;
}) => ({ coll, currentDate });
/**
 * A spy we'll ocasionally be using to mock implementation of our
 * `subscribe` function
 */
const subscribeSpy = jest.spyOn(firestoreSubscriptions, "subscribe");

describe("Firestore subscriptions", () => {
  /**
   * A test consumer id we're using as id of a "hook" calling to the add/remove listener
   */
  const consumerId = "subscribe-hook-1";
  /**
   * Another consumer we're using when testing for consumers, other
   * than test consumer, being present
   */
  const dummyConsumerId = "some-other-consumer";
  /**
   * A collection we're using throughout the tests
   */
  const collection = OrgSubCollection.Attendance;

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("Test adding subscription to a listener", () => {
    test("should create a new listener, if no listener registered for a particular collection", async () => {
      // mock `subscribe` implementation to have more control over `newListener` structure
      subscribeSpy.mockImplementationOnce(mockSubscribeImplementation as any);
      // set up test store
      const getState = () => createTestStore({ date: testDateLuxon });
      // run the thunk
      await addFirestoreListener(collection, consumerId)(
        mockDispatch,
        getState
      );
      // new listener we're expecting to be created on this test
      const newListener: FirestoreListener = {
        consumers: [consumerId],
        // here we're utilizing the mocked `subscribe` implementation as we want to test that
        // the returned value ended up in the `newListener`
        // later we'll test the actual function implementation
        unsubscribe: mockSubscribeImplementation({
          coll: collection,
          currentDate: testDateLuxon,
        }) as any,
      };
      expect(mockDispatch).toHaveBeenCalledWith(
        updateFirestoreListener(collection, newListener)
      );
    });

    test("should add consumer to consumers list of appropriate listener record, if the listener for a collection already exists", async () => {
      // mock `subscribe` implementation to have more control over `newListener` structure
      subscribeSpy.mockImplementationOnce(mockSubscribeImplementation as any);
      // set up test store
      const startingListener: FirestoreListener = {
        unsubscribe: () => {},
        consumers: [dummyConsumerId],
      };
      const getState = () =>
        createTestStore({
          date: testDateLuxon,
          listeners: { [collection]: startingListener },
        });
      // run the thunk
      await addFirestoreListener(collection, consumerId)(
        mockDispatch,
        getState
      );
      // expected updated listener after the test runs
      const updatedListener = {
        ...startingListener,
        // we're expecting only the `consumerId` to be added
        // as the listener already exists, we only want to subscribe a new consumer to it
        consumers: [...startingListener.consumers, consumerId],
      };
      expect(mockDispatch).toHaveBeenCalledWith(
        updateFirestoreListener(collection, updatedListener)
      );
    });
  });

  describe("Test removing of the subscription from a listener", () => {
    test("should remove a consumer from consumers list of a listener, if other consumer are registered", async () => {
      // set up test store
      const startingListener: FirestoreListener = {
        consumers: [consumerId, dummyConsumerId],
        unsubscribe: () => {},
      };
      const getState = () =>
        createTestStore({
          date: testDateLuxon,
          listeners: { [collection]: startingListener },
        });
      // run the thunk
      await removeFirestoreListener(collection, consumerId)(
        mockDispatch,
        getState
      );
      // expected updated listener after the test runs
      const updatedListener = {
        ...startingListener,
        // only the test consumer should be removed,
        // leaving the other consumers (and the listener itself) intact
        consumers: [dummyConsumerId],
      };
      expect(mockDispatch).toHaveBeenCalledWith(
        updateFirestoreListener(collection, updatedListener)
      );
    });

    test("should run unsubscribe function and remove the listener from the store, if the current consumer is the last one for the listener", async () => {
      const mockUnsubscribe = jest.fn();
      // set up test store
      const startingListener: FirestoreListener = {
        consumers: [consumerId],
        unsubscribe: mockUnsubscribe,
      };
      const getState = () =>
        createTestStore({
          date: testDateLuxon,
          listeners: { [collection]: startingListener },
        });
      // run the thunk
      await removeFirestoreListener(collection, consumerId)(
        mockDispatch,
        getState
      );
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        deleteFirestoreListener(collection)
      );
    });
  });
});

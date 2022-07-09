/**
 * @jest-environment jsdom
 */

import { OrgSubCollection } from "@eisbuk/shared";

import { CollectionSubscription } from "../../types";

import { getTestStore } from "../../__testUtils__/store";

import useFirestoreSubscribe from "../useFirestoreSubscribe";

import * as listenerThunks from "../../thunks";

import { getFirestoreListeners } from "../../selectors";

import { isEmpty } from "../../utils/helpers";

import { testHookWithRedux } from "../../__testUtils__/testHooksWithRedux";

// We're mocking a thunk calling out to firestore
// which we're not currently testing and would produce problems
// of firebase app not being initialised
jest.mock("../../thunks/subscribe", () => ({
  // The function in question is a HOF returning a thunk,
  // therefore, the mock needs to return a function returning a promise
  updateSubscription: () => () => Promise.resolve(),
}));

describe("Firestore subscriptions", () => {
  describe("useFirestoreSubscribe", () => {
    test("should subscribe to collections passed in as params (if not subscribed already)", () => {
      const store = getTestStore();
      let listeners = getFirestoreListeners(store.getState());
      // check that no listeners exist to begin with
      expect(isEmpty(listeners)).toBe(true);
      const collections: CollectionSubscription[] = [
        OrgSubCollection.Attendance,
        OrgSubCollection.Customers,
      ];
      testHookWithRedux(store, useFirestoreSubscribe, collections);
      listeners = getFirestoreListeners(store.getState());
      collections.forEach((coll) => {
        expect(listeners[coll]).toBeTruthy();
      });
    });

    test("should unubscribe from subscribed collection if said collection is not included in updated collection on props update", () => {
      const store = getTestStore();
      const initialCollections: CollectionSubscription[] = [
        OrgSubCollection.Attendance,
        OrgSubCollection.Customers,
      ];
      // subscribe to both of the `initialCollections`
      // we don't need to assert that listeners for both collections exist
      // as we've tested that in the previous test
      const updateHookProps = testHookWithRedux(
        store,
        useFirestoreSubscribe,
        initialCollections
      );
      // updating props without "attendnace" should remove a listener for said collection
      updateHookProps([OrgSubCollection.Customers]);
      const listeners = getFirestoreListeners(store.getState());
      expect(listeners[OrgSubCollection.Attendance]).toBeFalsy();
      // a listener for "customers" collection should be left untouched
      expect(listeners[OrgSubCollection.Customers]).toBeTruthy();
    });

    test("should only subscribe to new collections on props update (if some collections already subscribed to)", () => {
      const store = getTestStore();
      // subscribe to "customers" as subscribed collection
      // and check subscription
      const addListenerSpy = jest.spyOn(listenerThunks, "addFirestoreListener");
      const updateHookProps = testHookWithRedux(store, useFirestoreSubscribe, [
        OrgSubCollection.Customers,
      ]);
      // `addFirestoreListener` should only have been called once: for 'customers'
      expect(addListenerSpy).toHaveBeenCalledTimes(1);
      const firstCall = addListenerSpy.mock.calls[0];
      expect(firstCall[0].storeAs).toEqual(OrgSubCollection.Customers);
      // add different collection
      updateHookProps([
        OrgSubCollection.Attendance,
        OrgSubCollection.Customers,
      ]);
      // `addFirestoreListener` should have been called once for each subscribed collection: 'customers', 'attendance'
      expect(addListenerSpy).toHaveBeenCalledTimes(2);
      const secondCall = addListenerSpy.mock.calls[1];
      expect(secondCall[0].storeAs).toEqual(OrgSubCollection.Attendance);
    });
  });
});

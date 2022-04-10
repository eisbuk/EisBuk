import * as firestore from "@firebase/firestore";
import pRetry from "p-retry";

import { OrgSubCollection } from "@eisbuk/shared";

import { getNewStore } from "@/store/createStore";

import { updateSubscription } from "../subscribe";
import { updateFirestoreListener } from "@/react-redux-firebase/actions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { getAuthTestEnv } from "../__testUtils__/utils";

import {
  createTestSlots,
  testSlots,
  slotsCollPath,
} from "../__testData__/slots";

describe("Firestore subscriptions", () => {
  describe("test subscriptions with 'null' constraint", () => {
    testWithEmulator(
      "should subscribe to entire collection if constraint 'null'",
      async () => {
        const { dispatch, getState } = getNewStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // create test thunk
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: null,
        });
        // run the thunk
        await testThunk(dispatch, getState);
        const expectedSlots = testSlots.reduce(
          (acc, slot) => ({ ...acc, [slot.id]: slot }),
          {}
        );
        await pRetry(() => {
          expect(getState().firestore.data[OrgSubCollection.Slots]).toEqual(
            expectedSlots
          );
        });
      }
    );

    testWithEmulator(
      "should unsubscribe from previously subscribed collection (if any)",
      async () => {
        const { dispatch, getState } = getNewStore();
        const db = await getAuthTestEnv(createTestSlots);
        // subscribe functions to test `unsubscribe` composing
        const oldUnsubscribe = jest.fn();
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // set up test state
        dispatch(
          updateFirestoreListener(OrgSubCollection.Slots as any, {
            unsubscribe: oldUnsubscribe,
          })
        );
        // create test thunk
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: null,
        });
        // run the thunk
        await testThunk(dispatch, getState);
        expect(oldUnsubscribe).toHaveBeenCalled();
      }
    );

    testWithEmulator(
      "should update listener (in store) with newly created 'unsubscribe' function",
      async () => {
        const { dispatch, getState } = getNewStore();
        const db = await getAuthTestEnv(createTestSlots);
        // subscribe functions to test `unsubscribe` composing
        const newUnsubscribe = jest.fn();
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        jest.spyOn(firestore, "onSnapshot").mockReturnValue(newUnsubscribe);
        // create test thunk
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: null,
        });
        // run the thunk
        await testThunk(dispatch, getState);
        expect(newUnsubscribe).not.toHaveBeenCalled();
        getState().firestore.listeners[OrgSubCollection.Slots].unsubscribe();
        expect(newUnsubscribe).toHaveBeenCalled();
      }
    );
  });
});

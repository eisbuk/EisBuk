import { deleteDoc, doc } from "@firebase/firestore";
import * as firestore from "@firebase/firestore";
import pRetry from "p-retry";

import { Collection, OrgSubCollection } from "@eisbuk/shared";

import { getTestStore } from "../../__testUtils__/store";

import { updateSubscription } from "../subscribe";
import { updateFirestoreListener } from "../../actions";

import { organization } from "../../__testSetup__/firestoreSetup";

import { getAuthTestEnv } from "../__testUtils__/utils";
import { testWithEmulator } from "../../__testUtils__/envUtils";

import {
  createTestSlots,
  testSlots,
  slotsCollPath,
} from "../__testData__/slots";

describe("Firestore subscriptions", () => {
  describe("test subscriptions with range constraint", () => {
    testWithEmulator(
      "should subscribe to a given range if so provided",
      async () => {
        const { dispatch, getState } = getTestStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // create test thunk
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { range: ["date", testSlots[2].date, testSlots[4].date] },
        });
        // run the thunk
        await testThunk(dispatch, getState);
        const expectedSlots = testSlots
          .slice(2, 5)
          .reduce((acc, slot) => ({ ...acc, [slot.id]: slot }), {});
        await pRetry(() => {
          expect(getState().firestore.data[OrgSubCollection.Slots]).toEqual(
            expectedSlots
          );
        });
      }
    );

    testWithEmulator(
      "should delete entries from local store when deleted from firestore",
      async () => {
        const { dispatch, getState } = getTestStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // create test thunk
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          // to test this out we're subscribing to all slot entries
          constraint: { range: ["date", testSlots[0].date, testSlots[6].date] },
        });
        // run the thunk
        await testThunk(dispatch, getState);
        // wait until the slots are in the local store
        const expectedSlots = testSlots.reduce(
          (acc, slot) => ({ ...acc, [slot.id]: slot }),
          {}
        );
        await pRetry(() => {
          expect(getState().firestore.data[OrgSubCollection.Slots]).toEqual(
            expectedSlots
          );
        });
        // delete one slot from the store
        const slotRef = doc(
          db as any,
          Collection.Organizations,
          organization,
          OrgSubCollection.Slots,
          testSlots[0].id
        );
        await deleteDoc(slotRef);
        // check updated state
        const expectedSlots2 = testSlots
          .slice(1)
          .reduce((acc, slot) => ({ ...acc, [slot.id]: slot }), {});
        await pRetry(() => {
          expect(getState().firestore.data[OrgSubCollection.Slots]).toEqual(
            expectedSlots2
          );
        });
      }
    );

    testWithEmulator(
      "should update listener with subscribed range",
      async () => {
        const { dispatch, getState } = getTestStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // create test thunk
        const range: [string, string, string] = [
          "date",
          testSlots[2].date,
          testSlots[4].date,
        ];
        const testThunk1 = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { range },
        });
        // run the thunk
        await testThunk1(dispatch, getState);
        expect(getState().firestore.listeners["slots"].range).toEqual(range);

        // run different thunk to extend range
        const range2: [string, string, string] = [
          "date",
          testSlots[3].date,
          testSlots[5].date,
        ];
        const testThunk2 = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { range: range2 },
        });
        await testThunk2(dispatch, getState);
        expect(getState().firestore.listeners["slots"].range).toEqual([
          "date",
          testSlots[2].date,
          testSlots[5].date,
        ]);
      }
    );

    testWithEmulator(
      "should update listener with 'unsubscribe' function composed of the one in store and the new one, if the store listener contains range overlap",
      async () => {
        const { dispatch, getState } = getTestStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // set "old" `unsubscribe` function to store
        // as well as overlapping range
        const oldUnsubscribe = jest.fn();
        dispatch(
          updateFirestoreListener(OrgSubCollection.Slots as any, {
            unsubscribe: oldUnsubscribe,
            range: ["date", testSlots[0].date, testSlots[3].date],
          })
        );
        // new unsubsceibe function
        const unsubRange = jest.fn();
        jest.spyOn(firestore, "onSnapshot").mockReturnValue(unsubRange);
        // create test thunk
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { range: ["date", testSlots[2].date, testSlots[5].date] },
        });
        // run the thunk
        await testThunk(dispatch, getState);
        // no unsubscribe functions should be ran at this point
        expect(oldUnsubscribe).not.toHaveBeenCalled();
        expect(unsubRange).not.toHaveBeenCalled();
        // all unsubscribe functions should be called
        // when calling a new composed function
        getState().firestore.listeners[OrgSubCollection.Slots].unsubscribe();
        expect(oldUnsubscribe).toHaveBeenCalled();
        expect(unsubRange).toHaveBeenCalled();
      }
    );

    testWithEmulator(
      "edge case: if the range in store and the new range have no overlap, should unsubscribe and remove the old range from listener",
      async () => {
        const { dispatch, getState } = getTestStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // set "old" `unsubscribe` function to store
        // as well as non overlapping range
        const oldUnsubscribe = jest.fn();
        dispatch(
          updateFirestoreListener(OrgSubCollection.Slots as any, {
            unsubscribe: oldUnsubscribe,
            range: ["date", testSlots[0].date, testSlots[2].date],
          })
        );
        // new unsubscribe function
        const unsubRange = jest.fn();
        jest.spyOn(firestore, "onSnapshot").mockReturnValue(unsubRange);
        // create test thunk
        const range: [string, string, string] = [
          "date",
          testSlots[3].date,
          testSlots[5].date,
        ];
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { range },
        });
        // run the thunk
        await testThunk(dispatch, getState);
        // 'listener.unsubscribe' should be called while running the thunk
        expect(oldUnsubscribe).toHaveBeenCalled();
        expect(unsubRange).not.toHaveBeenCalled();
        // the store listener should be updated with only the new range
        const listener = getState().firestore.listeners[OrgSubCollection.Slots];
        expect(listener.range).toEqual(range);
        // on current (new) `listener.unsubscribe` call, only the latest range unsubscribe should be called
        getState().firestore.listeners[OrgSubCollection.Slots].unsubscribe();
        expect(oldUnsubscribe).toHaveBeenCalledTimes(1);
        expect(unsubRange).toHaveBeenCalled();
      }
    );

    testWithEmulator(
      "edge case: if the new range is wider (in both directions) then the one in store, should unsubscribe from the old and only subscribe to (and update listener with) the new",
      async () => {
        const { dispatch, getState } = getTestStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // set "old" `unsubscribe` function to store
        // as well as non overlapping range
        const oldUnsubscribe = jest.fn();
        dispatch(
          updateFirestoreListener(OrgSubCollection.Slots as any, {
            unsubscribe: oldUnsubscribe,
            range: ["date", testSlots[3].date, testSlots[5].date],
          })
        );
        // new unsubsceibe function
        const unsubRange = jest.fn();
        jest.spyOn(firestore, "onSnapshot").mockReturnValue(unsubRange);
        // create test thunk
        const range: [string, string, string] = [
          "date",
          testSlots[1].date,
          testSlots[6].date,
        ];
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { range },
        });
        // run the thunk
        await testThunk(dispatch, getState);
        // old 'listener.unsubscribe' should be called while running the thunk
        expect(oldUnsubscribe).toHaveBeenCalled();
        expect(unsubRange).not.toHaveBeenCalled();
        // the store listener should be updated with only the new range
        const listener = getState().firestore.listeners[OrgSubCollection.Slots];
        expect(listener.range).toEqual(range);
        // on current (new) `listener.unsubscribe` call, only the latest range unsubscribe should be called
        getState().firestore.listeners[OrgSubCollection.Slots].unsubscribe();
        expect(oldUnsubscribe).toHaveBeenCalledTimes(1);
        expect(unsubRange).toHaveBeenCalled();
      }
    );

    testWithEmulator(
      "edge case: if the new range is smaller or equal then the one in store, should not dispatch any updates",
      async () => {
        const { dispatch, getState } = getTestStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // set "old" `unsubscribe` function to store
        // as well as non overlapping range
        dispatch(
          updateFirestoreListener(OrgSubCollection.Slots as any, {
            range: ["date", testSlots[1].date, testSlots[6].date],
          })
        );
        // try subscribing to shorter range than already subscribed to
        const range: [string, string, string] = [
          "date",
          testSlots[2].date,
          testSlots[5].date,
        ];
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { range },
        });
        // run the thunk
        const mockDispatch = jest.fn();
        await testThunk(mockDispatch, getState);
        // no updates to the store should be made
        expect(mockDispatch).not.toHaveBeenCalled();
      }
    );
  });
});

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
  describe("test subscriptions with documents constraint", () => {
    testWithEmulator("should subscribe to provided documents", async () => {
      const { dispatch, getState } = getNewStore();
      const db = await getAuthTestEnv(createTestSlots);
      // mock `getFirestore` to use firestore from RulesTestContext
      jest.spyOn(firestore, "getFirestore").mockImplementation(() => db as any);
      // create test thunk
      const testThunk = updateSubscription({
        collPath: slotsCollPath,
        storeAs: OrgSubCollection.Slots,
        constraint: { documents: [testSlots[0].id, testSlots[1].id] },
      });
      // run the thunk
      await testThunk(dispatch, getState);
      const expectedSlots = testSlots
        .slice(0, 2)
        .reduce((acc, slot) => ({ ...acc, [slot.id]: slot }), {});
      await pRetry(() => {
        expect(getState().firestore.data[OrgSubCollection.Slots]).toEqual(
          expectedSlots
        );
      });
    });

    testWithEmulator(
      "should update listener with provided documents",
      async () => {
        const { dispatch, getState } = getNewStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // create test thunk
        const documents = [testSlots[0].id, testSlots[2].id];
        const testThunk1 = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { documents },
        });
        // run the thunk
        await testThunk1(dispatch, getState);
        expect(
          getState().firestore.listeners[OrgSubCollection.Slots].documents
        ).toEqual(documents);

        // run different thunk to extend subscribed documents
        const testThunk2 = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { documents: [testSlots[1].id, testSlots[2].id] },
        });
        await testThunk2(dispatch, getState);
        const expectedDocs = testSlots.slice(0, 3).map(({ id }) => id);
        expect(
          getState().firestore.listeners[OrgSubCollection.Slots].documents
        ).toEqual(expectedDocs);
      }
    );

    testWithEmulator(
      "should update listener with 'unsubscribe' function composed of the one in store (if one exists) and the new one(s)",
      async () => {
        const { dispatch, getState } = getNewStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // set "old" `unsubscribe` function to store
        const oldUnsubscribe = jest.fn();
        dispatch(
          updateFirestoreListener(OrgSubCollection.Slots as any, {
            unsubscribe: oldUnsubscribe,
          })
        );
        // we're returning a different (mocked) `unsubscribe` for each doc
        const unsubDoc1 = jest.fn();
        const unsubDoc2 = jest.fn();
        jest
          .spyOn(firestore, "onSnapshot")
          .mockReturnValueOnce(unsubDoc1)
          .mockReturnValueOnce(unsubDoc2);
        // create test thunk
        const documents = [testSlots[0].id, testSlots[2].id];
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { documents },
        });
        // run the thunk
        await testThunk(dispatch, getState);
        // no unsubscribe functions should be ran at this point
        expect(oldUnsubscribe).not.toHaveBeenCalled();
        expect(unsubDoc1).not.toHaveBeenCalled();
        expect(unsubDoc2).not.toHaveBeenCalled();
        // all unsubscribe functions should be called
        // when calling a new composed function
        getState().firestore.listeners[OrgSubCollection.Slots].unsubscribe();
        expect(oldUnsubscribe).toHaveBeenCalled();
        expect(unsubDoc1).toHaveBeenCalled();
        expect(unsubDoc2).toHaveBeenCalled();
      }
    );

    testWithEmulator(
      "should not dispatch any updates if there are no new documents to subscribe to",
      async () => {
        const { dispatch, getState } = getNewStore();
        const db = await getAuthTestEnv(createTestSlots);
        // mock `getFirestore` to use firestore from RulesTestContext
        jest
          .spyOn(firestore, "getFirestore")
          .mockImplementation(() => db as any);
        // set up test state
        dispatch(
          updateFirestoreListener(OrgSubCollection.Slots as any, {
            documents: [testSlots[0].id, testSlots[1].id],
          })
        );
        // try to subscribe to already subscribed document
        const documents = [testSlots[0].id];
        const testThunk = updateSubscription({
          collPath: slotsCollPath,
          storeAs: OrgSubCollection.Slots,
          constraint: { documents },
        });
        // run the thunk
        const mockDispatch = jest.fn();
        await testThunk(mockDispatch, getState);
        // nothing should be dispatched as there are no new subscriptions
        expect(mockDispatch).not.toHaveBeenCalled();
      }
    );
  });
});

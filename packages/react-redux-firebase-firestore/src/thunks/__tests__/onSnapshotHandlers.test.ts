import { collection, onSnapshot, setDoc, doc } from "@firebase/firestore";

import { Collection, OrgSubCollection } from "@eisbuk/shared";

import { getTestStore } from "../../__testUtils__/store";

import {
  createCollSnapshotHandler,
  createDocSnapshotHandler,
} from "../subscribe";

import { organization } from "../../__testSetup__/firestoreSetup";

import { getAuthTestEnv } from "../__testUtils__/utils";
import { testWithEmulator } from "../../__testUtils__/envUtils";

import { saul, gus } from "../../__testData__/customers";

describe("Firestore subscriptions", () => {
  describe("createCollSnapshotHandler", () => {
    testWithEmulator(
      "should update the local store on update to subscribed firestore collection",
      async () => {
        // set up test env
        const { dispatch, getState } = getTestStore();
        const db = await getAuthTestEnv();
        // using `customers` as test collection
        const customersRef = collection(
          db,
          Collection.Organizations,
          organization,
          OrgSubCollection.Customers
        );
        onSnapshot(
          customersRef,
          createCollSnapshotHandler(dispatch, OrgSubCollection.Customers)
        );
        // collection should be empty to begin with
        expect(getState().firestore.data.customers).not.toBeDefined();
        // add first customer to db and check local store update
        await setDoc(doc(customersRef, saul.id), saul);
        const expectedCustomers = { [saul.id]: saul };
        expect(getState().firestore.data.customers).toEqual(expectedCustomers);
        // check again for different customer
        await setDoc(doc(customersRef, gus.id), gus);
        expectedCustomers[gus.id] = gus;
        expect(getState().firestore.data.customers).toEqual(expectedCustomers);
      }
    );
  });

  describe("createCollSnapshotHandler", () => {
    testWithEmulator(
      "should update the local store on update to subscribed firestore collection",
      async () => {
        // set up test env
        const { dispatch, getState } = getTestStore();
        const db = await getAuthTestEnv();
        // using `saul` as test customer
        const saulRef = doc(
          db,
          Collection.Organizations,
          organization,
          OrgSubCollection.Customers,
          saul.id
        );
        onSnapshot(
          saulRef,
          createDocSnapshotHandler(dispatch, OrgSubCollection.Customers)
        );
        // collection should be empty to begin with
        expect(getState().firestore.data.customers).not.toBeDefined();
        // add first customer to db and check local store update
        await setDoc(saulRef, saul);
        expect(getState().firestore.data.customers![saul.id]).toEqual(saul);
        // check again with update
        const newSaul = { ...saul, name: "Not Saul" };
        await setDoc(saulRef, newSaul);
        expect(getState().firestore.data.customers![saul.id]).toEqual(newSaul);
      }
    );
  });
});

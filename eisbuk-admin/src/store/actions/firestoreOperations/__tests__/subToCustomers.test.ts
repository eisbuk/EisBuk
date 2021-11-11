import * as firestore from "@firebase/firestore";
import { collection } from "@firebase/firestore";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { db } from "@/__testSetup__/firestoreSetup";

import { __organization__ } from "@/lib/constants";

import { subscribe } from "../subscriptionHandlers";

import { store } from "@/store/store";

import { saul, gus, jian } from "@/__testData__/customers";
import { testDateLuxon } from "@/__testData__/date";
import { updateLocalColl } from "../actionCreators";

jest.spyOn(firestore, "getFirestore");

const customersCollPath = `${Collection.Organizations}/${__organization__}/${OrgSubCollection.Customers}`;

// we're using `onSnapshot` spy to test subscriptions to the firestore db
const onSnapshotSpy = jest.spyOn(firestore, "onSnapshot");

describe("Firestore subscription handlers", () => {
  describe("test subscribing to customers", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should subscribe to customers collection for an organization", () => {
      const customersCollRef = collection(db, customersCollPath);

      subscribe({
        coll: OrgSubCollection.Customers,
        dispatch: store.dispatch,
        currentDate: testDateLuxon,
      });

      expect(onSnapshotSpy.mock.calls[0][0]).toEqual(customersCollRef);
    });

    test("should update 'customers' entry in the local store on snapshot update (and overwrite the existing data completely)", () => {
      const initialCustomers = {
        saul,
        gus,
      };
      const updatedCustomers = {
        jian,
        gus,
      };
      const update = Object.keys(updatedCustomers).reduce(
        (acc, key) => [...acc, { id: key, data: () => updatedCustomers[key] }],
        [] as any[]
      );
      store.dispatch(
        updateLocalColl(OrgSubCollection.Customers, initialCustomers)
      );
      onSnapshotSpy.mockImplementation((_, callback) =>
        // we're calling the update callback immediately to simulate shapshot update
        (callback as any)(update)
      );

      subscribe({
        coll: OrgSubCollection.Customers,
        dispatch: store.dispatch,
        currentDate: testDateLuxon,
      });

      const updatedState = store.getState().firestore.data.customers;
      expect(updatedState).toEqual(updatedCustomers);
    });
  });
});

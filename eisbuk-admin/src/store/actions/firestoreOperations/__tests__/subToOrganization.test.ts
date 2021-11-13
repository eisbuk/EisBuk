import * as firestore from "@firebase/firestore";
import { doc } from "@firebase/firestore";

import { Collection } from "eisbuk-shared";

import { db } from "@/__testSetup__/firestoreSetup";

import { __organization__ } from "@/lib/constants";

import { getNewStore } from "@/store/createStore";

import { subscribe } from "../subscriptionHandlers";

import { testDateLuxon } from "@/__testData__/date";
import { FirestoreData } from "@/types/store";
import { updateLocalColl } from "../actionCreators";

// we're using `onSnapshot` spy to test subscriptions to the firestore db
const onSnapshotSpy = jest.spyOn(firestore, "onSnapshot");

describe("Firestore subscription handlers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("test subscribing to organization data", () => {
    test("should subscribe to provided organization's doc", () => {
      const organizationDocRef = doc(
        db,
        `${Collection.Organizations}/${__organization__}`
      );

      subscribe({
        coll: Collection.Organizations,
        currentDate: testDateLuxon,
        dispatch: jest.fn(),
      });

      expect(onSnapshotSpy.mock.calls[0][0]).toEqual(organizationDocRef);
    });

    test("should add organization data (keyed by organization name to) 'organizations' entry in the local store on snapshot update (without overwriting existing data)", () => {
      const { dispatch, getState } = getNewStore();

      const initialOrganizations: FirestoreData[Collection.Organizations] = {
        ["dummy-organization"]: {
          admins: ["dummy-organization-admin", "dummy-organization-admin"],
        },
      };
      const newOrgName = "new-orgnization";
      const newOrganizationEntry = {
        [newOrgName]: {
          admins: ["test-admin", "+335500"],
        },
      };
      const update = {
        id: newOrgName,
        data: () => newOrganizationEntry[newOrgName],
      };

      dispatch(updateLocalColl(Collection.Organizations, initialOrganizations));
      onSnapshotSpy.mockImplementation((_, callback) =>
        // we're calling the update callback immediately to simulate shapshot update
        (callback as any)(update)
      );

      subscribe({
        coll: Collection.Organizations,
        dispatch,
        currentDate: testDateLuxon,
      });

      const updatedState = getState().firestore.data.organizations;
      expect(updatedState).toEqual({
        ...initialOrganizations,
        ...newOrganizationEntry,
      });
    });
  });
});

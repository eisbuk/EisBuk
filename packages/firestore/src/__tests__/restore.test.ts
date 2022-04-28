/**
 * @jest-environment node
 */
import admin, { firestore } from "firebase-admin";

import { adminDb } from "../__testSetup__/adminDb";
import { deleteAll } from "../__testUtils__/deleteAll";
import { saul, walt, defaultUser } from "../__testData__/customers";

import { OrgSubCollection, Collection } from "@eisbuk/shared";

import * as restoreService from "../restore";
import { ISubCollectionData } from "src/types";

const __testOrganization__ = "test-organization-2";

/**
 * unPackCollectionData - Util to unwrap docs from query snapshot
 */
function unpackCollectionData(
  querySnapshot: firestore.QuerySnapshot
): ISubCollectionData[] {
  const resultData: ISubCollectionData[] = [];
  querySnapshot.forEach((doc) => resultData.push(doc.data()));

  return resultData;
}

jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);
jest.spyOn(admin, "initializeApp").mockImplementation((() => {}) as any);

afterEach(async () => {
  await deleteAll();
});

afterAll(() => {
  jest.resetAllMocks();
});

describe("Restore service", () => {
  const orgPath = `${Collection.Organizations}/${__testOrganization__}`;

  test("Sets organization document data", async () => {
    const orgData = { admins: [defaultUser.email] };

    const orgPayload = {
      id: __testOrganization__,
      data: orgData,
    };

    const res = await restoreService.setOrgRootData(orgPayload);

    if (res.ok === true) {
      const result = await adminDb.doc(orgPath).get();
      const resultData = result.data();

      expect(resultData).toEqual(orgData);
    } else {
      throw new Error(res.message);
    }
  });

  test("Sets an array of individual docs in a specified subcollection", async () => {
    const subColId = OrgSubCollection.Customers;
    const subColPath = `${orgPath}/${subColId}`;
    const subColData = {
      saul: saul,
      walt: walt,
    };

    await restoreService.setSubCollectionData(subColPath, subColData);

    const result = await adminDb.collection(subColPath).get();

    expect(result.empty).toBe(false);

    const resultData = unpackCollectionData(result);
    const expectedData = [saul, walt];

    expect(resultData).toEqual(expectedData);
  });
});

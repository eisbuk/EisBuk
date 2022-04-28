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

const orgRootPath = `${Collection.Organizations}/${__testOrganization__}`;
const customersSubcollectionPath = `${orgRootPath}/${OrgSubCollection.Customers}`;
const bookingsSubcollectionPath = `${orgRootPath}/${OrgSubCollection.Bookings}`;

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
  test("Sets organization document data", async () => {
    const orgData = { admins: [defaultUser.email] };

    const orgPayload = {
      id: __testOrganization__,
      data: orgData,
    };

    const res = await restoreService.setOrgRootData(orgPayload);

    if (res.ok === true) {
      const result = await adminDb.doc(orgRootPath).get();
      const resultData = result.data();

      expect(resultData).toEqual(orgData);
    } else {
      throw new Error(res.message);
    }
  });

  test("Sets an array of individual docs in a specified subcollection", async () => {
    const subColPayload = {
      saul: saul,
      walt: walt,
    };

    await restoreService.setSubCollectionData(
      customersSubcollectionPath,
      subColPayload
    );

    const result = await adminDb.collection(customersSubcollectionPath).get();

    expect(result.empty).toBe(false);

    const resultData = unpackCollectionData(result);
    const expectedData = [saul, walt];

    expect(resultData).toEqual(expectedData);
  });

  test("Set all docs in an array of subcollections", async () => {
    const subColPayload = {
      id: __testOrganization__,
      subCollections: {
        customers: {
          saul: saul,
          walt: walt,
        },
        bookings: {
          [saul.secretKey]: {
            deleted: false,
            surname: saul.surname,
            name: saul.name,
            id: saul.id,
            category: saul.category,
          },
          [walt.secretKey]: {
            deleted: false,
            surname: walt.surname,
            name: walt.name,
            id: walt.id,
            category: walt.category,
          },
        },
      },
    };

    const res = await restoreService.setOrgSubCollections(subColPayload);

    if (res.ok === true) {
      const customersResult = await adminDb
        .collection(customersSubcollectionPath)
        .get();
      const bookingsResult = await adminDb
        .collection(bookingsSubcollectionPath)
        .get();

      const customersData = unpackCollectionData(customersResult);
      const bookingsData = unpackCollectionData(bookingsResult);

      expect(customersData).toEqual([saul, walt]);
      expect(bookingsData).toEqual([
        subColPayload.subCollections.bookings[walt.secretKey],
        subColPayload.subCollections.bookings[saul.secretKey],
      ]);
    } else {
      throw new Error(res.message);
    }
  });
});

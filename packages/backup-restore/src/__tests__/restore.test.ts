/**
 * @jest-environment node
 */
import fs from "fs/promises";
import admin, { firestore } from "firebase-admin";
import { v4 as uuid } from "uuid";

import { adminDb } from "../__testSetup__/adminDb";
import { deleteAll } from "../__testUtils__/deleteAll";
import { saul, walt, defaultUser } from "../__testData__/customers";
import { bookings } from "../__testData__/bookings";

import { OrgSubCollection, Collection } from "@eisbuk/shared";

import { restoreSingleOrgFromFs } from "../commands/restore";
import * as restoreService from "../firestore/restore";

import { ISubCollectionData, FsErrors } from "../types";

/**
 * Test Data
 */
const __testOrganization__ = uuid();

const orgRootData = {
  admins: [defaultUser.email],
};

const customersSubColData = {
  saul,
  walt,
};
const bookingsSubColData = bookings;

const orgSubCollectionsData = {
  customers: customersSubColData,
  bookings: bookingsSubColData,
};

const org = {
  id: __testOrganization__,
  data: orgRootData,
  subCollections: orgSubCollectionsData,
};

/**
 * Test Collection Paths
 */
const orgRootPath = `${Collection.Organizations}/${__testOrganization__}`;
const customersSubcollectionPath = `${orgRootPath}/${OrgSubCollection.Customers}`;
const bookingsSubcollectionPath = `${orgRootPath}/${OrgSubCollection.Bookings}`;

/**
 * One-time Test Utils
 */

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

/**
 * Tests
 */
jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);
jest.spyOn(admin, "initializeApp").mockImplementation((() => {}) as any);

afterEach(async () => {
  await deleteAll();
});

afterAll(() => {
  jest.restoreAllMocks();
});

test("Sets organization document data", async () => {
  const orgPayload = {
    id: __testOrganization__,
    data: orgRootData,
  };

  const res = await restoreService.setOrgRootData(orgPayload);

  if (res.ok === true) {
    const result = await adminDb.doc(orgRootPath).get();
    const resultData = result.data();

    expect(resultData).toEqual(orgRootData);
  } else {
    throw new Error(res.message);
  }
});

test("Sets an array of individual docs in a specified subcollection", async () => {
  await restoreService.setSubCollectionData(
    customersSubcollectionPath,
    customersSubColData
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
    subCollections: orgSubCollectionsData,
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

test("Reads orgData from a .json file and writes it to db", async () => {
  const mockJsonData = JSON.stringify(org);

  jest.spyOn(fs, "access").mockResolvedValue();
  jest.spyOn(fs, "readFile").mockResolvedValue(mockJsonData);

  const filePath = "test.json";

  await restoreSingleOrgFromFs(filePath);

  const rootResult = await adminDb.doc(orgRootPath).get();
  const customersResult = await adminDb
    .collection(customersSubcollectionPath)
    .get();
  const bookingsResult = await adminDb
    .collection(bookingsSubcollectionPath)
    .get();

  const rootData = rootResult.data();
  const customersData = unpackCollectionData(customersResult);
  const bookingsData = unpackCollectionData(bookingsResult);

  expect(rootData).toEqual(org.data);
  expect(customersData).toEqual([saul, walt]);
  expect(bookingsData).toEqual([
    org.subCollections.bookings[walt.secretKey],
    org.subCollections.bookings[saul.secretKey],
  ]);
});

test("Throws an error if the file doesn't exist", async () => {
  jest.spyOn(fs, "access").mockRejectedValue(new Error());

  const filePath = "";

  await expect(restoreSingleOrgFromFs(filePath)).rejects.toThrow(
    FsErrors.FILE_NOT_FOUND
  );
});

test("Throws an error if the file is not valid json", async () => {
  jest.spyOn(fs, "access").mockResolvedValue();

  const filePath = "test.txt";

  await expect(restoreSingleOrgFromFs(filePath)).rejects.toThrow(
    FsErrors.INVALID_FILE
  );
});

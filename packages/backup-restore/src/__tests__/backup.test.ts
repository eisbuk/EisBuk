/**
 * @jest-environment node
 */
import fs from "fs/promises";
import path from "path";
import admin from "firebase-admin";
import { v4 as uuid } from "uuid";

import { OrgSubCollection, Collection } from "@eisbuk/shared";

import { adminDb } from "../__testSetup__/adminDb";
import { deleteAll } from "../__testUtils__/deleteAll";
import { waitForCondition } from "../__testUtils__/waitForCondition";
import { saul, walt, defaultUser } from "../__testData__/customers";
import { bookings } from "../__testData__/bookings";

import { backupSingleOrgToFs } from "../commands/backup";
import * as backupService from "../firestore/backup";

import { FirestoreErrors } from "../types";

/**
 * Test Data
 */
const __testOrganization__ = uuid();

const orgRootData = {
  admins: [defaultUser.email],
};

const bookingsSubColData = bookings;
const customersSubColData = {
  saul,
  walt,
};

/**
 * Test Collection Paths
 */
const orgRootPath = `${Collection.Organizations}/${__testOrganization__}`;
const customersSubcollectionPath = `${orgRootPath}/${OrgSubCollection.Customers}`;
const bookingsSubcollectionPath = `${orgRootPath}/${OrgSubCollection.Bookings}`;

/**
 * Tests
 */
jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);
jest.spyOn(admin, "initializeApp").mockImplementation((() => {}) as any);

afterEach(async () => {
  await deleteAll();
});

afterAll(() => {
  jest.resetAllMocks();
});

test("Returns a single organization by id", async () => {
  await adminDb.doc(`${orgRootPath}`).set(orgRootData);

  const result = await backupService.getOrg(__testOrganization__);

  if (result.ok) {
    const { id, data } = result.data;

    expect(id).toBe(__testOrganization__);
    expect(data).toEqual(orgRootData);
  }
});

test("Lists all existing organizations", async () => {
  await adminDb.doc(`${orgRootPath}`).set(orgRootData);

  const result = await backupService.getOrgs();

  if (result.ok) {
    const orgs = result.data;

    const numOfOrgs = orgs.length;
    const isIncludesTestOrg = orgs
      .map(({ id }) => id)
      .includes(__testOrganization__);

    expect(numOfOrgs).toBe(1);
    expect(isIncludesTestOrg).toBe(true);
  } else {
    throw new Error(result.message);
  }
});

test("Returns an negative result when no organisation is found", async () => {
  const result = await backupService.getOrg(__testOrganization__);

  if (!result.ok) {
    expect(result?.message).toBe(FirestoreErrors.EMPTY_DOC);
  } else {
    throw new Error();
  }
});

test("Returns an negative result when no organisations are found", async () => {
  const result = await backupService.getOrgs();

  if (!result.ok) {
    expect(result?.message).toBe(FirestoreErrors.EMPTY_COLLECTION);
  } else {
    throw new Error();
  }
});

describe("With subcollection data", () => {
  beforeEach(async () => {
    await adminDb.doc(`${orgRootPath}`).set(orgRootData);
    await adminDb.doc(`${customersSubcollectionPath}/${saul.id}`).set(saul);
    await adminDb.doc(`${customersSubcollectionPath}/${walt.id}`).set(walt);

    // * Note: `bookings` are created implicitly as a result of data trigger on Customers doc write
    // * => we need to wait for this op to finish before we assert against subcollections
    const saulBookingsPath = `${bookingsSubcollectionPath}/${saul.secretKey}`;
    const waltBookingsPath = `${bookingsSubcollectionPath}/${walt.secretKey}`;

    await waitForCondition({
      documentPath: saulBookingsPath,
      condition: (data) => Boolean(data !== undefined),
    });
    await waitForCondition({
      documentPath: waltBookingsPath,
      condition: (data) => Boolean(data !== undefined),
    });
  });

  test("Returns an array of subcollection paths", async () => {
    const paths = await backupService.getOrgSubCollectionPaths(
      __testOrganization__
    );

    const numOfSubcollections = paths.length;

    const expectedPathsResult = [
      {
        id: "bookings",
        path: bookingsSubcollectionPath,
      },
      {
        id: "customers",
        path: customersSubcollectionPath,
      },
    ];

    expect(numOfSubcollections).toBe(2);
    expect(paths).toEqual(expectedPathsResult);
  });

  test("Returns subcollection data for a single path", async () => {
    const data = await backupService.getSubCollectionData(
      customersSubcollectionPath
    );

    expect(data).toEqual(customersSubColData);
  });

  test("Returns all subcollection data for a specified org", async () => {
    const data = await backupService.getAllSubCollections(__testOrganization__);

    expect(data).toHaveProperty("bookings");
    expect(data).toHaveProperty("customers");
    expect(data.customers).toEqual(customersSubColData);
    expect(data.bookings).toEqual(bookingsSubColData);
  });

  test("Returns full org data", async () => {
    const result = await backupService.backupSingleOrganization(
      __testOrganization__
    );

    const expectedOrgData = {
      id: __testOrganization__,
      data: orgRootData,
      subCollections: {
        customers: customersSubColData,
        bookings: bookingsSubColData,
      },
    };

    if (result.ok) {
      const data = result.data;

      expect(data).toEqual(expectedOrgData);
    } else {
      throw new Error(result.message);
    }
  });

  test("Writes orgData to .json files", async () => {
    const spy = jest.spyOn(fs, "writeFile").mockImplementation();

    await backupSingleOrgToFs(__testOrganization__);

    const expectedFileBasename = `${__testOrganization__}.json`;
    const expectedOrgData = {
      id: __testOrganization__,
      data: orgRootData,
      subCollections: {
        customers: customersSubColData,
        bookings: bookingsSubColData,
      },
    };

    const [firstCall] = spy.mock.calls;
    const [resultPath, resultJson] = firstCall;

    expect(path.basename(resultPath as string)).toEqual(expectedFileBasename);
    expect(JSON.parse(resultJson as string)).toEqual(expectedOrgData);
  });
});

describe("Without subcollection data", () => {
  beforeEach(async () => {
    await adminDb.doc(`${orgRootPath}`).set(orgRootData);
  });

  test("Returns an empty array of subcollection paths", async () => {
    const paths = await backupService.getOrgSubCollectionPaths(
      __testOrganization__
    );

    const numOfSubcollections = paths.length;

    expect(numOfSubcollections).toBe(0);
  });

  test("Returns an empty object if the subcollection reference is empty", async () => {
    const data = await backupService.getSubCollectionData(
      customersSubcollectionPath
    );

    expect(data).toEqual({});
  });

  test("Returns an empty object if there are no subcollection references", async () => {
    const data = await backupService.getAllSubCollections(__testOrganization__);

    expect(data).toEqual({});
  });
});

/**
 * @jest-environment node
 */
import fs from "fs/promises";
import path from "path";
import admin, { initializeApp } from "firebase-admin";

import { OrgSubCollection, Collection } from "@eisbuk/shared";

import { adminDb } from "../__testSetup__/adminDb";

import { backupToFs, getAllOrganisationsData, backupService } from "../index";

import { saul, walt, defaultUser } from "../testData";

const __testOrganization__ = "test-organization";

const customersSubcollectionPath = `${Collection.Organizations}/${__testOrganization__}/${OrgSubCollection.Customers}`;
const bookingsSubcollectionPath = `${Collection.Organizations}/${__testOrganization__}/${OrgSubCollection.Bookings}`;

/**
 * @DELETE_THIS_COMMENT __withEmulators__ tells you if we're using emulators, while __isTest__ actually tells you if we're in a test environment
 * This was a quick, shorter version of `deleteAll` found in @eisbuk/client, it deletes all of the entries in the firestore db,
 * which might or might not cause the problems as @eisbuk/client one doesn't delete organization document I think...
 */
const deleteAll = async (): Promise<any> => {
  const collections = await adminDb.listCollections();
  return Promise.all(collections.map((ref) => adminDb.recursiveDelete(ref)));
};

beforeAll(async () => {
  await deleteAll();
});

beforeEach(async () => {
  await adminDb.doc(`${customersSubcollectionPath}/${saul.id}`).set(saul);
  await adminDb.doc(`${customersSubcollectionPath}/${walt.id}`).set(walt);

  // * Note: `bookings` are created implicitly as a result of data trigger on Customers doc write
});

afterEach(async () => {
  await deleteAll();
});

/**
 * @DELETE_THIS_COMMENT
 * Here we're mocking `admin.firestore()` (only function, not a namespace)
 * To always return our `adminDb`, removing the need for admin app initialization in the tests
 * and the bug s that come with it.
 * This way you have a complete (admin) control of the emulated firestore, both from outside the tested code
 * as well as inside (as `admin.firestore` returns the same Firestore instance).
 */
jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);
jest.spyOn(admin, "initializeApp").mockImplementation((() => {}) as any);

describe("Backup service", () => {
  it("Lists all existing organizations", async () => {
    const result = await backupService.getOrgs();

    if (result.ok) {
      const orgs = result.data;

      const numOfOrgs = orgs.length;
      const isIncludesTestOrg = orgs
        .map(({ id }) => id)
        .includes(__testOrganization__);

      expect(numOfOrgs).toBeGreaterThan(0);
      expect(isIncludesTestOrg).toBe(true);
    } else {
      fail(result.message);
    }
  });

  it("Returns an array of subcollection paths", async () => {
    const paths = await backupService.getSubCollectionPaths(
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

  it("Returns subcollection data for a single path", async () => {
    const data = await backupService.getSubCollectionData(
      customersSubcollectionPath
    );

    const expectedData = {
      saul: saul,
      walt: walt,
    };

    expect(data).toEqual(expectedData);
  });

  it("Returns all subcollection data for a specified org", async () => {
    const data = await backupService.getAllSubCollectionData(
      __testOrganization__
    );

    const expectedCustomerData = {
      saul: saul,
      walt: walt,
    };

    expect(data).toHaveProperty("bookings");
    expect(data).toHaveProperty("customers");
    expect(data.customers).toEqual(expectedCustomerData);
  });
});

describe("Backup", () => {
  const expectedOrgData = {
    id: __testOrganization__,
    data: {
      admins: [defaultUser.email],
      existingSecrets: [],
    },
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

  it("Returns full org data", async () => {
    const result = await getAllOrganisationsData();

    if (result.ok) {
      const [data] = result.data;

      expect(data).toEqual(expectedOrgData);
    } else {
      /**
       * @DELETE_THIS_COMMENT I've replaced `fail(error)` with exception, as I think it achieves the desired
       * result, and `fail()` was failing with "fail is not defined" message (even though it's jest standard api)
       */
      throw new Error(result.message);
    }
  });

  xit("Writes orgData to .json files", async () => {
    const spy = jest.spyOn(fs, "writeFile").mockImplementation();

    try {
      await backupToFs();

      const expectedFileBasename = `${__testOrganization__}.json`;

      const [firstCall] = spy.mock.calls;
      const [resultPath, resultJson] = firstCall;

      expect(path.basename(resultPath as string)).toEqual(expectedFileBasename);
      expect(JSON.parse(resultJson as string)).toEqual(expectedOrgData);

      spy.mockRestore();
    } catch (err: any) {
      throw err;
    }
  });
});

/**
 * @jest-environment node
 */
import fs from "fs/promises";
import path from "path";
import admin from "firebase-admin";

import { OrgSubCollection, Collection } from "@eisbuk/shared";

import { adminDb } from "../__testSetup__/adminDb";
import { deleteAll } from "../__testUtils__/deleteAll";
import { saul, walt, defaultUser } from "../__testData__/customers";

import { backupToFs, getAllOrganisationsData } from "../";
import * as backupService from "../backup";

const __testOrganization__ = "test-organization";

const customersSubcollectionPath = `${Collection.Organizations}/${__testOrganization__}/${OrgSubCollection.Customers}`;
const bookingsSubcollectionPath = `${Collection.Organizations}/${__testOrganization__}/${OrgSubCollection.Bookings}`;

jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);
jest.spyOn(admin, "initializeApp").mockImplementation((() => {}) as any);

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

afterAll(() => {
  jest.resetAllMocks();
})

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

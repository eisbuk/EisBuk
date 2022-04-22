/**
 * @jest-environment node
 */
import fs from "fs/promises";

import { __testOrganization__, defaultUser } from "@/__testSetup__/envData";
import { adminDb } from "@/__testSetup__/firestoreSetup";
import { deleteAll } from "@/__testUtils__/firestore";
import { saul, walt } from "@/__testData__/customers";

import { OrgSubCollection, Collection } from "@eisbuk/shared";

import {
  backup,
  getOrgData,
  getOrgs,
  getSubCollectionPaths,
  getSubCollectionData,
  getAllSubCollectionData,
} from "@eisbuk/firestore";

const customersSubcollectionPath = `${Collection.Organizations}/${__testOrganization__}/${OrgSubCollection.Customers}`;
const bookingsSubcollectionPath = `${Collection.Organizations}/${__testOrganization__}/${OrgSubCollection.Bookings}`;

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

it("Lists all existing organizations", async () => {
  const result = await getOrgs();

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

describe("SubCollection Data", () => {
  it("Returns an array of subcollection paths", async () => {
    const paths = await getSubCollectionPaths(__testOrganization__);

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
    const data = await getSubCollectionData(customersSubcollectionPath);

    const expectedData = {
      saul: saul,
      walt: walt,
    };

    expect(data).toEqual(expectedData);
  });

  it("Returns all subcollection data for a specified org", async () => {
    const data = await getAllSubCollectionData(__testOrganization__);

    const expectedCustomerData = {
      saul: saul,
      walt: walt,
    };

    expect(data).toHaveProperty("bookings");
    expect(data).toHaveProperty("customers");
    expect(data.customers).toEqual(expectedCustomerData);
  });
});

describe("Organization Data", () => {
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
    const result = await getOrgData();

    if (result.ok) {
      const [data] = result.data;

      expect(data).toEqual(expectedOrgData);
    } else {
      fail(result.message);
    }
  });

  it("Writes orgData to .json files", async () => {
    const spy = jest.spyOn(fs, "writeFile").mockImplementation();

    const result = await backup();

    if (result.ok) {
      const orgFilePath = `${__testOrganization__}.json`;

      const [firstCall] = spy.mock.calls;
      const [resultPath, resultJson] = firstCall;

      expect(resultPath).toEqual(orgFilePath);
      expect(JSON.parse(resultJson as string)).toEqual(expectedOrgData);

      spy.mockRestore();
    } else {
      fail(result.message);
    }
  });
});

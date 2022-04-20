/**
 * @jest-environment node
 */

import { __testOrganization__ } from "@/__testSetup__/envData";
import { adminDb } from "@/__testSetup__/firestoreSetup";
import { deleteAll } from "@/__testUtils__/firestore";
import { saul, walt } from "@/__testData__/customers";

import { OrgSubCollection, Collection } from "@eisbuk/shared";

import {
  getOrgs,
  getSubCollectionPaths,
  getSubCollectionData,
  getAllSubCollectionData,
} from "@eisbuk/firestore";

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

describe("Collects subcollection facts", () => {
  const customersSubcollectionPath = `${Collection.Organizations}/${__testOrganization__}/${OrgSubCollection.Customers}`;
  const bookingsSubcollectionPath = `${Collection.Organizations}/${__testOrganization__}/${OrgSubCollection.Bookings}`;

  beforeEach(async () => {
    await adminDb.doc(`${customersSubcollectionPath}/${saul.id}`).set(saul);
    await adminDb.doc(`${customersSubcollectionPath}/${walt.id}`).set(walt);

    // * Note: `bookings` are created implicitly as a result of data trigger on Customers doc write
  });

  afterEach(async () => {
    await deleteAll();
  });

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

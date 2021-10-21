import firebase from "firebase";

import {
  Category,
  Collection,
  Customer,
  OrgSubCollection,
} from "eisbuk-shared";

import { adminDb } from "./settings";
import { ORGANIZATION } from "@/config/envInfo";

import { deleteAll } from "./utils";
import { waitForCondition, getDocumentRef } from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";

type DocumentData = firebase.firestore.DocumentData;

beforeEach(async () => {
  await deleteAll([OrgSubCollection.Customers, OrgSubCollection.Bookings]);
});

// string path to `customers` collection
const customersPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Customers}`;

describe("Customer triggers", () => {
  testWithEmulator(
    "apply secretKey when a customer record is added and keeps customer data up to date",
    async () => {
      const testCustomers: (Pick<Customer, "id"> & Pick<Customer, "name">)[] = [
        {
          name: "John",
          id: "foo",
        },
        {
          name: "Jane",
          id: "bar",
        },
      ];
      await Promise.all(
        testCustomers.map((customer) =>
          getDocumentRef(adminDb, `${customersPath}/${customer.id!}`).set(
            customer
          )
        )
      );

      const [fooFromDB, barFromDB] = await Promise.all(
        testCustomers.map(({ id }) =>
          waitForCondition({
            documentPath: `${customersPath}/${id}`,
            condition: hasSecretKey,
          })
        ) as Promise<Customer>[]
      );

      expect(fooFromDB.name).toBe("John");
      expect(Boolean(fooFromDB.secretKey)).toBe(true);

      expect(barFromDB.name).toBe("Jane");
      expect(Boolean(barFromDB.secretKey)).toBe(true);
    }
  );

  testWithEmulator(
    "populate bookings when a customer record is added or changed",
    async (done) => {
      const testCustomer = {
        name: "Jane",
        surname: "Doe",
        id: "baz",
        category: Category.Course,
      };
      await getDocumentRef(adminDb, `${customersPath}/${testCustomer.id}`).set(
        testCustomer
      );

      const fromDbBaz = (await waitForCondition({
        documentPath: `${customersPath}/baz`,
        condition: hasSecretKey,
      })) as Customer;
      const bookingsInfo = await waitForCondition({
        documentPath: `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Bookings}/${fromDbBaz.secretKey}`,
        condition: (data) => Boolean(data),
      });

      expect(bookingsInfo?.name).toEqual("Jane");
      expect(bookingsInfo?.surname).toEqual("Doe");
      expect(bookingsInfo?.category).toEqual(Category.Course);

      await getDocumentRef(adminDb, `${customersPath}/baz`).set({
        ...testCustomer,
        category: Category.Competitive,
      });
      await waitForCondition({
        documentPath: `${customersPath}/baz`,
        condition: (data) => data?.category === Category.Competitive,
      });
      done();
    }
  );
});

/**
 * Check for secretKey in provided document.
 * Used to test `addMissingSecretKey` function for
 * customer registration
 * @param data document data
 * @returns whether secret key exists
 */
const hasSecretKey = (data: DocumentData | undefined) => {
  return data && data.secretKey;
};

import firebase from "firebase";

import { adminDb } from "./settings";
import { deleteAll } from "./utils";
import pRetry from "p-retry";
type DocumentData = firebase.firestore.DocumentData;

beforeEach(async () => {
  await deleteAll(["customers", "bookings"]);
});

it("Applies secret_key when a customer record is added and keeps customer data up to date", async (done) => {
  const coll = adminDb
    .collection("organizations")
    .doc("default")
    .collection("customers");
  const testCustomers = [
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
    testCustomers.map((customer) => coll.doc(customer.id).set(customer))
  );

  const fromDbFoo = await waitForCondition({
    collection: "customers",
    id: "foo",
    condition: hasSecretKey,
  });
  expect(fromDbFoo?.name).toBe("John");
  expect(Boolean(fromDbFoo?.secret_key)).toBe(true);

  const fromDbBar = await waitForCondition({
    collection: "customers",
    id: "bar",
    condition: hasSecretKey,
  });
  expect(fromDbBar?.name).toBe("Jane");
  expect(Boolean(fromDbBar?.secret_key)).toBe(true);
  done();
});

it("Populates bookings when a customer record is added or changed", async (done) => {
  const orgsColl = adminDb.collection("organizations").doc("default");
  const customersColl = orgsColl.collection("customers");
  const testCustomer = {
    name: "Jane",
    surname: "Doe",
    id: "baz",
    category: "corso",
  };
  await customersColl.doc(testCustomer.id).set(testCustomer);

  const fromDbBaz = await waitForCondition({
    collection: "customers",
    id: "baz",
    condition: hasSecretKey,
  });
  const bookingsInfo = (
    await orgsColl.collection("bookings").doc(fromDbBaz?.secret_key).get()
  ).data();
  expect(bookingsInfo?.name).toEqual("Jane");
  expect(bookingsInfo?.surname).toEqual("Doe");
  expect(bookingsInfo?.category).toEqual("corso");

  await customersColl.doc("baz").set({ ...testCustomer, category: "agonismo" });
  await waitForCondition({
    collection: "customers",
    id: "baz",
    condition: (data) => data?.category === "agonismo",
  });
  done();
});

/**
 * @param data document data
 * @returns whether secret key exists
 */
const hasSecretKey = (data: DocumentData | undefined) => {
  return data && data.secret_key;
};

interface WaitForCondition {
  (params: {
    collection: string;
    id: string;
    condition: (data: DocumentData | undefined) => boolean;
    attempts?: number;
    sleep?: number;
  }): Promise<DocumentData | undefined>;
}

const waitForCondition: WaitForCondition = async ({
  collection,
  id,
  condition,
  attempts = 10,
  sleep = 400,
}) => {
  // Retries to fetch item until condition is true.
  let doc: DocumentData | undefined;
  const coll = adminDb
    .collection("organizations")
    .doc("default")
    .collection(collection);
  await pRetry(
    // Try to fetch the customer `foo` until
    // it includes a `secret_key` key
    async () => {
      doc = (await coll.doc(id).get()).data();
      return condition(doc)
        ? Promise.resolve()
        : Promise.reject(new Error(`${id} was not updated successfully`));
    },
    { retries: attempts, minTimeout: sleep, maxTimeout: sleep }
  );
  return doc;
};

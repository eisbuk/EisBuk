/**
 * @jest-environment node
 */

import { collection, doc, setDoc, getDocs } from "@firebase/firestore";

import {
  Category,
  Collection,
  Customer,
  OrgSubCollection,
  getCustomerBase,
} from "@eisbuk/shared";

import { db } from "@/__testSetup__/firestoreSetup";

import { getOrganization } from "@/lib/getters";

import { deleteAll } from "@/__testUtils__/firestore";
import { waitForCondition } from "@/__testUtils__/helpers";
import { stripIdAndSecretKey } from "@/__testUtils__/customers";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { loginDefaultUser } from "@/__testUtils__/auth";

import { saul } from "@/__testData__/customers";

const customersCollectionPath = `${
  Collection.Organizations
}/${getOrganization()}/${OrgSubCollection.Customers}`;
const bookingsCollectionPath = `${
  Collection.Organizations
}/${getOrganization()}/${OrgSubCollection.Bookings}`;

describe("Customer triggers", () => {
  beforeEach(async () => {
    await loginDefaultUser();
  });

  beforeEach(async () => {
    await deleteAll();
  });

  testWithEmulator(
    "should apply secretKey and customerId (to customer structure) when a customer record is added",
    async () => {
      const customersCollRef = collection(db, customersCollectionPath);
      // we're using saul's data only as newly created object (on `id` or `secretKey`)
      const newSaul = stripIdAndSecretKey(saul);
      // we're setting a customer entry without id to the database (as id's are generated serverside)
      const saulDocRef = doc(customersCollRef);
      await setDoc(saulDocRef, newSaul);
      // get newly generated id from db entry
      const customersSnapshot = await getDocs(customersCollRef);
      const saulSnapshot = customersSnapshot.docs[0];
      const saulId = saulSnapshot.id;
      // get entire saul entry from customers snapshot
      const { id, secretKey, ...saulFromDB } =
        (await waitForCondition({
          documentPath: `${customersCollectionPath}/${saulId}`,
          condition: (data) => data && data.secretKey && data.id,
        })) || {};

      // expect id (the same as assigned doc.id) to be added within customer structure
      expect(id).toBe(saulId);
      expect(secretKey).toBeDefined();
      // expect the rest of the customer queried by id to be the same as the one set to db
      expect(saulFromDB).toEqual(newSaul);
    }
  );

  testWithEmulator(
    "should create bookings entry (for customer) when a customer record is created",
    async () => {
      const customersCollRef = collection(db, customersCollectionPath);
      // we're testing customer creation as it would happen in the wild (no `id` and `secretKey`) initially
      // we're also adding an `extendedDate` to assure it gets copied over to `bookings` as well
      const extendedDate = "2022-01-01";
      const newSaul = { ...stripIdAndSecretKey(saul), extendedDate };
      const saulDocRef = doc(customersCollRef);
      await setDoc(saulDocRef, { ...saul, extendedDate });
      // get the server generated id for saul
      const saulId = saulDocRef.id;
      // wait for `secretKey` to be generated by the data trigger
      const { secretKey } = (await waitForCondition({
        documentPath: `${customersCollectionPath}/${saulId}`,
        condition: (data) => data && data.secretKey,
      })) as Customer;
      // wait for customer entry to be added to `bookings` collection
      const bookingsEntry = await waitForCondition({
        documentPath: `${bookingsCollectionPath}/${secretKey}`,
        condition: (data) => Boolean(data),
      });
      // customer base structure of saul's data (for comparison)
      const saulBase = getCustomerBase({ ...newSaul, id: saulId });
      expect(bookingsEntry).toEqual(saulBase);
    }
  );

  testWithEmulator(
    "should update customer's 'bookings' entry when a customer record is updated",
    async () => {
      const saulDocRef = doc(db, customersCollectionPath, saul.id);
      await setDoc(saulDocRef, saul);
      // the existing `secretKey` should be used
      const { secretKey } = saul;
      // wait for first round of `bookings` entry updates
      await waitForCondition({
        documentPath: `${bookingsCollectionPath}/${secretKey}`,
        condition: (data) => Boolean(data),
      });
      // add update to db
      const updatedCategory = Category.Course;
      const updatedSaul = {
        ...saul,
        secretKey,
        category: updatedCategory,
        deleted: true,
      };
      await setDoc(saulDocRef, updatedSaul);
      // check `bookings` entry updates
      await waitForCondition({
        documentPath: `${bookingsCollectionPath}/${secretKey}`,
        condition: (data) =>
          Boolean(
            data && data.category === updatedCategory && data.deleted === true
          ),
      });
    }
  );
});

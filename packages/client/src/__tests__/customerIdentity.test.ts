/**
 * @vitest-environment node
 */
import { describe, expect } from "vitest";
import { v4 as uuid } from "uuid";
import { Category } from "@eisbuk/shared";

import { adminDb } from "@/__testSetup__/firestoreSetup";
import { setUpOrganization } from "@/__testSetup__/node";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitFor } from "@/__testUtils__/helpers";
import { deliverFirestoreWriteEvent } from "@/__testUtils__/firestoreEvents";

const profile = {
  name: "Test",
  surname: "Athlete",
  categories: [Category.Competitive],
  subscriptionNumber: "123",
};

const setupCustomer = async () => {
  const { organization } = await setUpOrganization({ setSecrets: false });
  const customer = adminDb.doc(
    `organizations/${organization}/customers/${uuid()}`
  );
  const data = { ...profile, id: customer.id, secretKey: uuid() };
  const bookings = adminDb.collection(`organizations/${organization}/bookings`);
  await customer.set(data);
  await waitFor(async () => {
    expect((await bookings.doc(data.secretKey).get()).data()?.id).toBe(
      customer.id
    );
  });
  return { organization, customer, data, bookings };
};

describe("Customer identity synchronization", () => {
  testWithEmulator(
    "duplicate creation keeps the assigned key and creates one mirror",
    async () => {
      const { organization } = await setUpOrganization({ setSecrets: false });
      const customer = adminDb.doc(
        `organizations/${organization}/customers/${uuid()}`
      );
      const bookings = adminDb.collection(
        `organizations/${organization}/bookings`
      );
      await customer.set(profile);
      await waitFor(async () => {
        expect((await customer.get()).data()?.secretKey).toBeTruthy();
      });
      const key = (await customer.get()).data()!.secretKey;

      await Promise.all([
        deliverFirestoreWriteEvent(
          "addCustomerIdAndSecretKey",
          customer.path,
          null,
          profile
        ),
        deliverFirestoreWriteEvent(
          "addCustomerIdAndSecretKey",
          customer.path,
          null,
          profile
        ),
      ]);

      expect((await customer.get()).data()!.secretKey).toBe(key);
      const mirrors = await bookings.where("id", "==", customer.id).get();
      expect(mirrors.docs.map((doc) => doc.id)).toEqual([key]);
      expect(mirrors.docs[0].data().secretKey).toBe(key);
    }
  );

  testWithEmulator(
    "late profile events preserve current deletion and categories",
    async () => {
      const { customer, data, bookings } = await setupCustomer();
      const deleted = {
        ...data,
        deleted: true,
        categories: [],
        subscriptionNumber: "",
      };
      await customer.set(deleted);
      await waitFor(async () => {
        expect((await bookings.doc(data.secretKey).get()).data()?.deleted).toBe(
          true
        );
      });
      await deliverFirestoreWriteEvent(
        "addCustomerIdAndSecretKey",
        customer.path,
        profile,
        data
      );
      expect((await bookings.doc(data.secretKey).get()).data()).toMatchObject({
        deleted: true,
        categories: [],
        subscriptionNumber: "",
      });
    }
  );

  testWithEmulator(
    "a late create cannot resurrect a hard-deleted customer",
    async () => {
      const { customer } = await setupCustomer();
      await customer.delete();
      await deliverFirestoreWriteEvent(
        "addCustomerIdAndSecretKey",
        customer.path,
        null,
        profile
      );
      expect((await customer.get()).exists).toBe(false);
    }
  );

  testWithEmulator(
    "hard deletion disables mirrors and preserves booking history",
    async () => {
      const { customer, data, bookings } = await setupCustomer();
      const mirror = bookings.doc(data.secretKey);
      const history = mirror.collection("bookedSlots").doc("synthetic-history");
      await history.set({ date: "2020-01-10", interval: "10:00-10:50" });
      await customer.delete();
      await deliverFirestoreWriteEvent(
        "addCustomerIdAndSecretKey",
        customer.path,
        data,
        null
      );
      expect((await mirror.get()).data()).toMatchObject({
        deleted: true,
        categories: [],
      });
      expect((await history.get()).exists).toBe(true);
    }
  );

  testWithEmulator(
    "key rotation disables the old mirror even when its event is replayed",
    async () => {
      const { customer, data, bookings } = await setupCustomer();
      const updated = { ...data, secretKey: uuid() };
      await customer.set(updated);
      await deliverFirestoreWriteEvent(
        "addCustomerIdAndSecretKey",
        customer.path,
        data,
        updated
      );
      await deliverFirestoreWriteEvent(
        "addCustomerIdAndSecretKey",
        customer.path,
        profile,
        data
      );
      expect((await bookings.doc(data.secretKey).get()).data()).toMatchObject({
        deleted: true,
        categories: [],
      });
      expect(
        (await bookings.doc(updated.secretKey).get()).data()
      ).toMatchObject(updated);
      expect((await customer.get()).data()!.secretKey).toBe(updated.secretKey);
    }
  );
});

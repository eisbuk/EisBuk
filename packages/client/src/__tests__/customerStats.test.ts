/**
 * @vitest-environment node
 */
import { describe, expect } from "vitest";
import { v4 as uuid } from "uuid";
import { Category, SlotType } from "@eisbuk/shared";

import { adminDb } from "@/__testSetup__/firestoreSetup";
import { setUpOrganization } from "@/__testSetup__/node";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitFor } from "@/__testUtils__/helpers";
import { deliverFirestoreWriteEvent } from "@/__testUtils__/firestoreEvents";

const date = "2031-10-10";
const interval = "10:00-10:50";
const setup = async () => {
  const { organization } = await setUpOrganization({ setSecrets: false });
  const org = adminDb.doc(`organizations/${organization}`);
  const customer = org.collection("customers").doc();
  const data = {
    id: customer.id,
    secretKey: uuid(),
    name: "Test",
    surname: "Athlete",
    categories: [Category.Competitive],
  };
  await customer.set(data);
  const mirror = org.collection("bookings").doc(data.secretKey);
  await waitFor(async () => expect((await mirror.get()).exists).toBe(true));
  const slot = org.collection("slots").doc();
  const slotData = {
    id: slot.id,
    date,
    type: SlotType.Ice,
    categories: [Category.Competitive],
    intervals: { [interval]: { startTime: "10:00", endTime: "10:50" } },
  };
  await slot.set(slotData);
  await waitFor(async () =>
    expect(
      (await org.collection("slotsByDay").doc("2031-10").get()).data()?.[
        date
      ]?.[slot.id]
    ).toBeTruthy()
  );
  const booking = mirror.collection("bookedSlots").doc(slot.id);
  return { org, customer, slot, slotData, booking };
};

const stats = async (
  customer: FirebaseFirestore.DocumentReference,
  month: string
) => (await customer.get()).data()?.bookingStats?.[month];

describe("Customer booking statistics", () => {
  testWithEmulator(
    "counts a booking when the slot aggregate has not been populated",
    async () => {
      const { org, customer, booking } = await setup();
      await org.collection("slotsByDay").doc("2031-10").delete();
      const entry = { date, interval };
      await booking.set(entry);
      await deliverFirestoreWriteEvent(
        "createCustomerStats",
        booking.path,
        null,
        entry
      );
      expect(await stats(customer, "2031-10")).toEqual({
        ice: 1,
        "off-ice": 0,
      });
    }
  );

  testWithEmulator(
    "malformed historical intervals do not prevent valid booked hours from updating",
    async () => {
      const { org, customer, slotData, booking } = await setup();
      await booking.set({ date, interval });
      await waitFor(async () =>
        expect(await stats(customer, "2031-10")).toEqual({
          ice: 1,
          "off-ice": 0,
        })
      );

      const invalidIntervals = ["malformed", "10:xx-11:00", "11:00-10:00", 123];
      await Promise.all(
        invalidIntervals.map(async (invalid, index) => {
          const id = `invalid-interval-${index}`;
          await org
            .collection("slots")
            .doc(id)
            .set({ ...slotData, id });
          await booking.parent.doc(id).set({ date, interval: invalid });
        })
      );
      const id = "another-valid-slot";
      await org
        .collection("slots")
        .doc(id)
        .set({ ...slotData, id });
      const second = booking.parent.doc(id);
      const entry = { date, interval };
      await second.set(entry);
      await deliverFirestoreWriteEvent(
        "createCustomerStats",
        second.path,
        null,
        entry
      );

      expect(await stats(customer, "2031-10")).toEqual({
        ice: 2,
        "off-ice": 0,
      });
      expect(
        (await booking.parent.doc("invalid-interval-0").get()).exists
      ).toBe(true);
    }
  );

  testWithEmulator(
    "date changes recalculate both the old and new months",
    async () => {
      const { org, customer, slot, slotData, booking } = await setup();
      const entry = { date, interval };
      await booking.set(entry);
      await waitFor(async () =>
        expect(await stats(customer, "2031-10")).toEqual({
          ice: 1,
          "off-ice": 0,
        })
      );
      const moved = { ...slotData, date: "2031-11-10" };
      await slot.set(moved);
      const updated = { ...entry, date: moved.date };
      await booking.set(updated);
      await deliverFirestoreWriteEvent(
        "createCustomerStats",
        booking.path,
        entry,
        updated
      );
      expect(await stats(customer, "2031-10")).toEqual({
        ice: 0,
        "off-ice": 0,
      });
      expect(await stats(customer, "2031-11")).toEqual({
        ice: 1,
        "off-ice": 0,
      });
      await waitFor(async () => {
        expect(
          (
            await org.collection("slotBookingsCounts").doc("2031-10").get()
          ).data()?.[slot.id]
        ).toBe(0);
        expect(
          (
            await org.collection("slotBookingsCounts").doc("2031-11").get()
          ).data()?.[slot.id]
        ).toBe(1);
      });
    }
  );

  testWithEmulator(
    "slot type changes recalculate booked hours without a booking write",
    async () => {
      const { customer, slot, slotData, booking } = await setup();
      await booking.set({ date, interval });
      await waitFor(async () =>
        expect(await stats(customer, "2031-10")).toEqual({
          ice: 1,
          "off-ice": 0,
        })
      );
      const changed = { ...slotData, type: SlotType.OffIce };
      await slot.set(changed);
      await waitFor(async () =>
        expect(await stats(customer, "2031-10")).toEqual({
          ice: 0,
          "off-ice": 1,
        })
      );
    }
  );

  testWithEmulator(
    "slot deletion clears its hours without deleting historical bookings",
    async () => {
      const { customer, slot, booking } = await setup();
      await booking.set({ date, interval });
      await waitFor(async () =>
        expect(await stats(customer, "2031-10")).toEqual({
          ice: 1,
          "off-ice": 0,
        })
      );
      await slot.delete();
      await waitFor(async () =>
        expect(await stats(customer, "2031-10")).toEqual({
          ice: 0,
          "off-ice": 0,
        })
      );
      expect((await booking.get()).exists).toBe(true);
    }
  );

  testWithEmulator(
    "duplicate and delayed events converge after concurrent cancellations",
    async () => {
      const { customer, slot, booking } = await setup();
      const entry = { date, interval };
      await booking.set(entry);
      await waitFor(async () =>
        expect(await stats(customer, "2031-10")).toEqual({
          ice: 1,
          "off-ice": 0,
        })
      );
      await booking.delete();
      await Promise.all(
        Array.from({ length: 4 }, () =>
          deliverFirestoreWriteEvent(
            "createCustomerStats",
            booking.path,
            null,
            entry
          )
        )
      );
      await waitFor(async () =>
        expect(await stats(customer, "2031-10")).toEqual({
          ice: 0,
          "off-ice": 0,
        })
      );
      expect((await slot.get()).exists).toBe(true);
    }
  );

  testWithEmulator(
    "an event for an old key uses the booking under the current key",
    async () => {
      const { org, customer, booking } = await setup();
      const entry = { date, interval };
      await booking.set(entry);
      const oldMirror = org.collection("bookings").doc(uuid());
      await oldMirror.set({ id: customer.id, deleted: true, categories: [] });
      const oldBooking = oldMirror.collection("bookedSlots").doc(booking.id);
      const oldEntry = { date, interval: "10:00-11:40" };
      await oldBooking.set(oldEntry);
      await deliverFirestoreWriteEvent(
        "createCustomerStats",
        oldBooking.path,
        null,
        oldEntry
      );
      expect(await stats(customer, "2031-10")).toEqual({
        ice: 1,
        "off-ice": 0,
      });
    }
  );
});

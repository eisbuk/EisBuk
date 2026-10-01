/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { Provider as ReduxProvider } from "react-redux";
import { DateTime } from "luxon";

import { OrgSubCollection } from "@eisbuk/shared";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { getNewStore } from "@/store/createStore";

import { getMonthBookingsSummary } from "../calendarTotals";

// #region firestoreMock
/**
 * Firestore is mocked: each 'onSnapshot' call records its snapshot handler
 * and returns its own unsubscribe spy, so the test can deliver snapshots by hand
 * (also after unsubscribing, as a late snapshot) and check which listeners were stopped.
 */
const snapshotListeners = vi.hoisted(
  () =>
    [] as {
      path: string;
      options?: { includeMetadataChanges?: boolean };
      handler: (snapshot: any) => void;
      unsubscribe: ReturnType<typeof vi.fn>;
    }[]
);

vi.mock("@firebase/firestore", () => ({
  getFirestore: () => ({}),
  collection: (_db: unknown, path: string) => ({ path }),
  doc: (collRef: { path: string }, id: string) => ({
    path: `${collRef.path}/${id}`,
    id,
  }),
  query: (ref: unknown) => ref,
  where: () => undefined,
  // onSnapshot(ref, handler) or onSnapshot(ref, options, handler)
  onSnapshot: (ref: { path: string }, ...args: any[]) => {
    const handler = args[args.length - 1];
    const options = args.length > 1 ? args[0] : undefined;
    const unsubscribe = vi.fn();
    snapshotListeners.push({ path: ref.path, options, handler, unsubscribe });
    return unsubscribe;
  },
}));

/** A snapshot of a document that doesn't exist, from the server unless `fromCache` */
const missingDocSnapshot = (id: string, fromCache = false) => ({
  id,
  data: () => undefined,
  metadata: { fromCache, hasPendingWrites: false },
});
// #endregion firestoreMock

const SlotsByDaySubscriber: React.FC = () => {
  useFirestoreSubscribe("test-organization", [
    { collection: OrgSubCollection.SlotsByDay },
  ]);
  return null;
};

const getSlotsByDayListener = (store: ReturnType<typeof getNewStore>) =>
  store.getState().firestore.listeners[OrgSubCollection.SlotsByDay];

describe("Firestore listener lifecycle (slotsByDay, as subscribed by the customer area)", () => {
  beforeEach(() => {
    snapshotListeners.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("subscribe -> last consumer removed -> late snapshot -> resubscribe", async () => {
    // Thunk middleware is only added when an extra argument is passed
    const store = getNewStore(
      { app: { calendarDay: DateTime.fromISO("2026-10-01") } },
      { getFirestore: vi.fn(), getFunctions: vi.fn() } as any
    );
    const renderSubscriber = () =>
      render(
        <ReduxProvider store={store}>
          <SlotsByDaySubscriber />
        </ReduxProvider>
      );

    // Subscribe: one document listener per month (previous, current, next)
    const { unmount } = renderSubscriber();
    expect(snapshotListeners.map(({ path }) => path.split("/").pop())).toEqual([
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
    const firstSubscription = [...snapshotListeners];
    expect(getSlotsByDayListener(store)?.consumers).toHaveLength(1);

    // Receipts are recorded while the listener exists
    act(() => {
      firstSubscription[1].handler(missingDocSnapshot("2026-10"));
    });
    expect(getSlotsByDayListener(store)?.receivedDocuments).toEqual([
      "2026-10",
    ]);
    expect(getMonthBookingsSummary(store.getState()).excluded).toEqual([]);

    // Last consumer removed (the hook removes its listeners 50ms after unmount)
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(getSlotsByDayListener(store)).toBeUndefined();
    // The firestore subscriptions are actually stopped (the real unsubscribe was kept)
    firstSubscription.forEach(({ unsubscribe }) =>
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    );

    // A late snapshot (e.g. already queued when unsubscribing) must not recreate a partial listener entry
    act(() => {
      firstSubscription[1].handler(missingDocSnapshot("2026-10"));
    });
    expect(getSlotsByDayListener(store)).toBeUndefined();

    // Resubscribe: a complete listener is registered again, without errors
    snapshotListeners.length = 0;
    const { unmount: unmountAgain } = renderSubscriber();
    // Let the (async) thunks settle, so that a rejection would surface here
    await act(async () => {
      await Promise.resolve();
    });
    const listener = getSlotsByDayListener(store)!;
    expect(listener.consumers).toHaveLength(1);
    expect(listener.meta).toBeDefined();
    expect(listener.documents).toEqual(["2026-09", "2026-10", "2026-11"]);
    // Nothing is considered received until the new subscription delivers it
    expect(listener.receivedDocuments).toBeUndefined();
    expect(snapshotListeners).toHaveLength(3);

    // ...and can be removed again
    unmountAgain();
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(getSlotsByDayListener(store)).toBeUndefined();
    snapshotListeners.forEach(({ unsubscribe }) =>
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    );
  });

  test("cached absence of the month's document -> server confirmation", async () => {
    // The athlete has bookings for a month whose 'slotsByDay' document isn't in the local cache
    // (e.g. offline, or evicted from the cache)
    const store = getNewStore(
      {
        app: { calendarDay: DateTime.fromISO("2026-10-01") },
        firestore: {
          data: {
            bookedSlots: {
              "slot-oct-02": { date: "2026-10-02", interval: "16:00-17:50" },
            },
          },
          listeners: {},
        },
      },
      { getFirestore: vi.fn(), getFunctions: vi.fn() } as any
    );
    render(
      <ReduxProvider store={store}>
        <SlotsByDaySubscriber />
      </ReduxProvider>
    );

    // Document listeners receive metadata-only snapshots, so that the server's confirmation arrives
    // even when nothing changed
    snapshotListeners.forEach(({ options }) =>
      expect(options).toEqual({ includeMetadataChanges: true })
    );
    const octoberListener = snapshotListeners.find(({ path }) =>
      path.endsWith("/2026-10")
    )!;

    // Snapshot from the cache: the document is absent, but that isn't confirmed
    act(() => {
      octoberListener.handler(missingDocSnapshot("2026-10", true));
    });
    expect(getSlotsByDayListener(store)?.receivedDocuments).toBeUndefined();
    // Still treated as loading: the booking is neither shown nor reported as a missing lesson
    expect(getMonthBookingsSummary(store.getState()).excluded).toEqual([]);

    // Server confirmation (metadata-only snapshot): the document really doesn't exist
    act(() => {
      octoberListener.handler(missingDocSnapshot("2026-10", false));
    });
    expect(getSlotsByDayListener(store)?.receivedDocuments).toEqual([
      "2026-10",
    ]);
    expect(getMonthBookingsSummary(store.getState()).excluded).toEqual([
      {
        slotId: "slot-oct-02",
        date: "2026-10-02",
        interval: "16:00-17:50",
        reason: "missing-slot",
      },
    ]);
  });
});

/**
 * @vitest-environment jsdom
 */

import React, { useEffect } from "react";
import { describe, vi, expect, test, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { Provider as ReduxProvider, useSelector } from "react-redux";
import { DateTime } from "luxon";

import { Collection, OrgSubCollection } from "@eisbuk/shared";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { getNewStore } from "@/store/createStore";
import { getAdminSlots } from "@/store/selectors/slots";
import useConnectAuthToStore from "@/react-redux-firebase-auth/hooks/useConnectAuthToStore";

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

/**
 * Delivers a snapshot whose data didn't change (only `fromCache` did, e.g. going offline or back online).
 * Like the Firestore SDK (QueryListener), it reaches the handler only if the listener was subscribed
 * with `includeMetadataChanges: true`.
 */
const deliverMetadataOnly = (
  listener: (typeof snapshotListeners)[number],
  snapshot: unknown
) => {
  if (listener.options?.includeMetadataChanges) listener.handler(snapshot);
};

// Auth is mocked: only the auth status revalidation triggered by organization updates is observed
vi.mock("@firebase/auth", () => ({
  onAuthStateChanged: () => () => {},
}));
const updateAuthUser = vi.hoisted(() =>
  vi.fn(() => ({ type: "test/updateAuthUser" }))
);
vi.mock("@/store/actions/authOperations", () => ({ updateAuthUser }));
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
    updateAuthUser.mockClear();
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

  test("unchanged organization snapshots across online -> offline -> online don't revalidate the admin's auth", async () => {
    const store = getNewStore(
      { app: { calendarDay: DateTime.fromISO("2026-10-01") } },
      { getFirestore: vi.fn(), getFunctions: vi.fn() } as any
    );
    const AdminApp: React.FC = () => {
      useConnectAuthToStore({} as any, store);
      useFirestoreSubscribe("test-organization", [
        { collection: Collection.Organizations },
      ]);
      return null;
    };
    render(
      <ReduxProvider store={store}>
        <AdminApp />
      </ReduxProvider>
    );

    const organizationListener = snapshotListeners.find(({ path }) =>
      path.endsWith("organizations/test-organization")
    )!;
    // Only the listeners whose missing documents need confirming receive metadata-only snapshots
    expect(organizationListener.options).toEqual({
      includeMetadataChanges: false,
    });

    // Each snapshot returns a new (equal) data object, as the SDK does
    const organizationSnapshot = (fromCache: boolean) => ({
      id: "test-organization",
      data: () => ({ admins: ["admin@example.com"] }),
      metadata: { fromCache, hasPendingWrites: false },
    });

    // Online: the organization is received, the auth status is checked once
    act(() => {
      organizationListener.handler(organizationSnapshot(false));
    });
    const organizations = store.getState().firestore.data.organizations;
    expect(organizations).toEqual({
      "test-organization": { admins: ["admin@example.com"] },
    });
    expect(updateAuthUser).toHaveBeenCalledTimes(1);

    // Offline, then online again: unchanged data
    // Every dispatch reaching the store notifies its subscribers (and re-runs the selectors)
    let dispatches = 0;
    store.subscribe(() => {
      dispatches++;
    });
    act(() => {
      deliverMetadataOnly(organizationListener, organizationSnapshot(true));
    });
    act(() => {
      deliverMetadataOnly(organizationListener, organizationSnapshot(false));
    });

    // No extra dispatch, same reference, no new auth status request
    expect(dispatches).toEqual(0);
    expect(store.getState().firestore.data.organizations).toBe(organizations);
    expect(updateAuthUser).toHaveBeenCalledTimes(1);
  });

  test("metadata-only slotsByDay snapshots dispatch nothing (the slots page's paste lock isn't reset)", async () => {
    const store = getNewStore(
      { app: { calendarDay: DateTime.fromISO("2026-10-01") } },
      { getFirestore: vi.fn(), getFunctions: vi.fn() } as any
    );

    // Same pattern as the slots page: the paste controls are re-enabled
    // by an effect running whenever 'getAdminSlots' returns a new value
    let slotsEffectRuns = 0;
    const SlotsPageLike: React.FC = () => {
      useFirestoreSubscribe("test-organization", [
        { collection: OrgSubCollection.SlotsByDay },
      ]);
      const slotsToShow = useSelector(getAdminSlots);
      useEffect(() => {
        slotsEffectRuns++;
      }, [slotsToShow]);
      return null;
    };
    render(
      <ReduxProvider store={store}>
        <SlotsPageLike />
      </ReduxProvider>
    );

    const octoberListener = snapshotListeners.find(({ path }) =>
      path.endsWith("/2026-10")
    )!;
    // Each snapshot returns a new (equal) data object, as the SDK does
    const monthSnapshot = (fromCache: boolean, notes = "Pista 1") => ({
      id: "2026-10",
      data: () => ({
        "2026-10-01": {
          "slot-1": {
            id: "slot-1",
            date: "2026-10-01",
            type: "ice",
            categories: [],
            notes,
            intervals: {
              "16:00-16:50": { startTime: "16:00", endTime: "16:50" },
            },
          },
        },
      }),
      metadata: { fromCache, hasPendingWrites: false },
    });

    // Server snapshot: data and receipt are stored
    act(() => {
      octoberListener.handler(monthSnapshot(false));
    });
    const slotsByDay = store.getState().firestore.data.slotsByDay;
    expect(slotsByDay?.["2026-10"]["2026-10-01"]["slot-1"].notes).toEqual(
      "Pista 1"
    );
    expect(getSlotsByDayListener(store)?.receivedDocuments).toEqual([
      "2026-10",
    ]);

    // Going offline, then back online: metadata-only snapshots with unchanged data
    const effectRunsBefore = slotsEffectRuns;
    // Every dispatch reaching the store notifies its subscribers (and re-runs the selectors)
    let dispatches = 0;
    store.subscribe(() => {
      dispatches++;
    });
    act(() => {
      deliverMetadataOnly(octoberListener, monthSnapshot(true));
    });
    act(() => {
      deliverMetadataOnly(octoberListener, monthSnapshot(false));
    });

    // Nothing dispatched: same references, the effect (paste lock reset) doesn't run
    expect(dispatches).toEqual(0);
    expect(store.getState().firestore.data.slotsByDay).toBe(slotsByDay);
    expect(slotsEffectRuns).toEqual(effectRunsBefore);

    // A real change is still dispatched
    act(() => {
      octoberListener.handler(monthSnapshot(false, "Pista 2"));
    });
    expect(
      store.getState().firestore.data.slotsByDay?.["2026-10"]["2026-10-01"][
        "slot-1"
      ].notes
    ).toEqual("Pista 2");
    expect(slotsEffectRuns).toBeGreaterThan(effectRunsBefore);
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

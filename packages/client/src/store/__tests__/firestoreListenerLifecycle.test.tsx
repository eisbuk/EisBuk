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

// #region firestoreMock
/**
 * Firestore is mocked: each 'onSnapshot' call records its snapshot handler
 * and returns its own unsubscribe spy, so the test can check which subscriptions were stopped.
 */
const snapshotListeners = vi.hoisted(
  () =>
    [] as {
      path: string;
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
    const unsubscribe = vi.fn();
    snapshotListeners.push({ path: ref.path, handler, unsubscribe });
    return unsubscribe;
  },
}));
// #endregion firestoreMock

const SlotsByDaySubscriber: React.FC = () => {
  useFirestoreSubscribe("test-organization", [
    { collection: OrgSubCollection.SlotsByDay },
  ]);
  return null;
};

const getSlotsByDayListener = (store: ReturnType<typeof getNewStore>) =>
  store.getState().firestore.listeners[OrgSubCollection.SlotsByDay];

describe("Firestore listener lifecycle", () => {
  beforeEach(() => {
    snapshotListeners.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("removing the last consumer stops the firestore subscriptions; subscribing again works", async () => {
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
    const listener = getSlotsByDayListener(store)!;
    expect(listener.consumers).toHaveLength(1);
    expect(listener.meta).toBeDefined();
    expect(listener.documents).toEqual(["2026-09", "2026-10", "2026-11"]);

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

    // Subscribe again: a complete listener and new firestore subscriptions
    snapshotListeners.length = 0;
    const { unmount: unmountAgain } = renderSubscriber();
    await act(async () => {
      await Promise.resolve();
    });
    const newListener = getSlotsByDayListener(store)!;
    expect(newListener.consumers).toHaveLength(1);
    expect(newListener.documents).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(snapshotListeners).toHaveLength(3);

    // ...and removing it stops them again
    unmountAgain();
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(getSlotsByDayListener(store)).toBeUndefined();
    snapshotListeners.forEach(({ unsubscribe }) =>
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    );
  });
});

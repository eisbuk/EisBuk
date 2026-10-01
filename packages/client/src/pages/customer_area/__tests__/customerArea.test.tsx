/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, act, fireEvent, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { Link, MemoryRouter, Route } from "react-router-dom";

import { OrgSubCollection } from "@eisbuk/shared";
import {
  useFirestoreSubscribe,
  useUpdateSubscription,
} from "@eisbuk/react-redux-firebase-firestore";

import CustomerArea from "..";
import { getNewStore } from "@/store/createStore";
import { Action } from "@/enums/store";

vi.mock("@eisbuk/react-redux-firebase-firestore", async () => ({
  ...(await vi.importActual<object>("@eisbuk/react-redux-firebase-firestore")),
  useFirestoreSubscribe: vi.fn(),
  useUpdateSubscription: vi.fn(),
}));

// Keep the page's routing and subscription wiring; child views have their own tests.
vi.mock("../views/Book", () => ({ default: () => null }));
vi.mock("../views/Calendar", () => ({ default: () => null }));
vi.mock("../views/Profile", () => ({ default: () => null }));
vi.mock("@/controllers/AdminBar", () => ({ default: () => null }));
vi.mock("@/controllers/AthleteAvatar", () => ({ default: () => null }));
vi.mock("@/controllers/PrivacyPolicyToast", () => ({ default: () => null }));
vi.mock("@/features/notifications/components", () => ({
  NotificationsContainer: () => null,
}));
vi.mock("@/lib/getters", () => ({
  getOrganization: () => "test-organization",
}));

const getBookingsKeys = () => {
  const calls = vi.mocked(useFirestoreSubscribe).mock.calls;
  const subscription = calls[calls.length - 1][1].find(
    ({ collection }) => collection === OrgSubCollection.Bookings,
  );
  return subscription?.collection === OrgSubCollection.Bookings
    ? subscription.meta.secretKeys
    : undefined;
};

const getBookingsUpdate = () => {
  const calls = vi
    .mocked(useUpdateSubscription)
    .mock.calls.filter(
      ([{ collection }]) => collection === OrgSubCollection.Bookings,
    );
  const [subscription, deps] = calls[calls.length - 1];
  expect(subscription.collection).toBe(OrgSubCollection.Bookings);
  if (subscription.collection !== OrgSubCollection.Bookings) {
    throw new Error("Expected a bookings subscription update");
  }
  return { keys: subscription.meta.secretKeys, deps };
};

describe("CustomerArea bookings subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.each([
    { name: "anonymous visitor", isAdmin: false, secretKeys: undefined },
    { name: "admin without linked accounts", isAdmin: true, secretKeys: [] },
    {
      name: "admin with another account",
      isAdmin: true,
      secretKeys: ["other"],
    },
    {
      name: "signed-in athlete with another account",
      isAdmin: false,
      secretKeys: ["other"],
    },
    {
      name: "linked athlete",
      isAdmin: false,
      secretKeys: ["current", "other"],
    },
  ])("includes the route's athlete for $name", ({ isAdmin, secretKeys }) => {
    const store = getNewStore({ auth: { isAdmin, secretKeys } });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/customer_area/current"]}>
          <Route path="/customer_area/:secretKey" component={CustomerArea} />
        </MemoryRouter>
      </Provider>,
    );

    const expectedKeys = secretKeys?.includes("other")
      ? ["current", "other"]
      : ["current"];
    const keys = getBookingsKeys();
    expect(keys).toHaveLength(expectedKeys.length);
    expect(keys).toEqual(expect.arrayContaining(expectedKeys));
    expect(getBookingsUpdate().keys).toBe(keys);
  });

  test("updates on route and auth changes, keeping dependencies stable on other renders", () => {
    const store = getNewStore({
      auth: { isAdmin: true, secretKeys: ["other"] },
    });
    const page = (
      <Provider store={store}>
        <MemoryRouter initialEntries={["/customer_area/current"]}>
          <Link to="/customer_area/next">Next account</Link>
          <Route path="/customer_area/:secretKey" component={CustomerArea} />
        </MemoryRouter>
      </Provider>
    );
    const { rerender } = render(page);
    const initialKeys = getBookingsUpdate().deps[0];

    // A UI state change causes a page render without changing auth or route.
    act(() => {
      store.dispatch({ type: Action.UpdateAdminStatus, payload: false });
    });
    rerender(page);
    expect(getBookingsUpdate().deps[0]).toBe(initialKeys);

    fireEvent.click(screen.getByText("Next account"));
    expect(getBookingsKeys()).toEqual(
      expect.arrayContaining(["next", "other"]),
    );
    expect(getBookingsKeys()).not.toContain("current");
    expect(getBookingsUpdate().deps[0]).not.toBe(initialKeys);

    act(() => {
      store.dispatch({ type: Action.Logout });
    });
    expect(getBookingsKeys()).toEqual(["next"]);
    const anonymousKeys = getBookingsUpdate().deps[0];

    act(() => {
      store.dispatch({ type: Action.UpdateAdminStatus, payload: true });
    });
    expect(getBookingsUpdate().deps[0]).toBe(anonymousKeys);

    act(() => {
      store.dispatch({
        type: Action.UpdateAuthInfo,
        payload: { ...store.getState().auth, secretKeys: ["linked"] },
      });
    });
    expect(getBookingsKeys()).toEqual(
      expect.arrayContaining(["next", "linked"]),
    );
  });
});

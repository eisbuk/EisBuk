/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test } from "vitest";
import { screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";

import CustomerAreaPage from "../index";

import { getNewStore } from "@/store/createStore";

import { renderWithRedux } from "@/__testUtils__/wrappers";

import { saul } from "@/__testData__/customers";
import { getSecretKey } from "@/store/selectors/app";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

const mockUseParams = vi.fn();
vi.mock("react-router", async () => {
  const rr = (await vi.importActual("react-router")) as object;

  return {
    ...rr,
    useParams: () => mockUseParams(),
  };
});

const mockUseFirestoreSubscribe = vi.fn();
vi.mock("@eisbuk/react-redux-firebase-firestore", async () => {
  const rrff = (await vi.importActual(
    "@eisbuk/react-redux-firebase-firestore"
  )) as object;

  return {
    ...rrff,
    useFirestoreSubscribe: (...params: any[]) =>
      mockUseFirestoreSubscribe(...params),
  };
});

// The following mocks are here as to not break the app
// and keep the test somewhat sandboxed
vi.mock("@/store/actions/bookingOperations", () => ({
  bookSlot: vi.fn(),
  cancelBooking: vi.fn(),
}));
vi.mock("@/features/notifications/hooks", () => ({
  useNotifications: () => ({
    active: undefined,
    handleRemoveNotification: vi.fn(),
  }),
}));

describe("CustomerAreaPage", () => {
  test("should store `secretKey` to `localStorage` on mount and remove on unmount", () => {
    const testKey = "secret-key-123";
    mockUseParams.mockImplementation(() => ({ secretKey: testKey }));

    const store = getNewStore();

    const { unmount } = renderWithRedux(
      <BrowserRouter>
        <CustomerAreaPage />
      </BrowserRouter>,
      store
    );

    // Should store secret key on mount
    () => expect(getSecretKey(store.getState())).toEqual(testKey);
    // Should remove secret key on unmount
    unmount();
    expect(getSecretKey(store.getState())).toBeFalsy();
  });

  test("should subscribe to all necessary firestore entries", () => {
    const store = getNewStore();

    renderWithRedux(
      <BrowserRouter>
        <CustomerAreaPage />
      </BrowserRouter>,
      store
    );

    const [, subscriptions] = mockUseFirestoreSubscribe.mock
      .calls[0] as Parameters<typeof useFirestoreSubscribe>;

    const wantSubscriptions = [
      OrgSubCollection.SlotsByDay,
      OrgSubCollection.Bookings,
      Collection.PublicOrgInfo,
      BookingSubCollection.BookedSlots,
      BookingSubCollection.Calendar,
    ];

    wantSubscriptions.forEach((subscription) =>
      expect(
        subscriptions.find(({ collection }) => subscription === collection)
      ).toBeTruthy()
    );
  });

  test("should read customer data from the store and render an avatar", () => {
    const { secretKey } = saul;
    mockUseParams.mockImplementation(() => ({ secretKey }));

    const store = getNewStore({
      firestore: {
        data: {
          bookings: {
            [secretKey]: saul,
          },
        },
      },
    });

    renderWithRedux(
      <BrowserRouter>
        <CustomerAreaPage />
      </BrowserRouter>,
      store
    );

    const saulRegex = new RegExp(`${saul.name} ${saul.surname}`);
    screen.getByText(saulRegex);
  });
});

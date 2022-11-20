/**
 * @jest-environment jsdom
 */

import React from "react";
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

const mockUseParams = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useParams: () => mockUseParams(),
}));

const mockUseFirestoreSubscribe = jest.fn();
jest.mock("@eisbuk/react-redux-firebase-firestore", () => ({
  ...jest.requireActual("@eisbuk/react-redux-firebase-firestore"),
  useFirestoreSubscribe: (...params: any[]) =>
    mockUseFirestoreSubscribe(...params),
}));

// The following mocks are here as to not break the app
// and keep the test somewhat sandboxed
jest.mock("@/store/actions/bookingOperations", () => ({
  bookSlot: jest.fn(),
  cancelBooking: jest.fn(),
}));
jest.mock("@/features/notifications/hooks", () => ({
  useNotifications: () => ({
    active: undefined,
    handleRemoveNotification: jest.fn(),
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

    const [subscriptions] = mockUseFirestoreSubscribe.mock.calls[0];
    const wantSubscriptions = [
      OrgSubCollection.SlotsByDay,
      OrgSubCollection.Bookings,
      Collection.PublicOrgInfo,
      BookingSubCollection.BookedSlots,
      BookingSubCollection.Calendar,
    ];
    wantSubscriptions.forEach((subscription) =>
      expect(subscriptions.includes(subscription)).toBeTruthy()
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

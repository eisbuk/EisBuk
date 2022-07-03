/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen } from "@testing-library/react";

import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";

import CustomerAreaPage from "../index";

import { getNewStore } from "@/store/createStore";
import { updateLocalDocuments } from "@/react-redux-firebase/actions";

import { getSecretKey } from "@/utils/localStorage";

import { renderWithRedux } from "@/__testUtils__/wrappers";

import { saul } from "@/__testData__/customers";

const mockUseParams = jest.fn();
jest.mock("react-router", () => ({
  useParams: () => mockUseParams(),
}));

const mockUseFirestoreSubscribe = jest.fn();
jest.mock(
  "@/react-redux-firebase/hooks/useFirestoreSubscribe",
  () =>
    (...params: any[]) =>
      mockUseFirestoreSubscribe(...params)
);

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

// Set up test store
const testStore = getNewStore();
testStore.dispatch(
  updateLocalDocuments(OrgSubCollection.Bookings, { [saul.secretKey]: saul })
);

describe("CustomerAreaPage", () => {
  test("should store `secretKey` to `localStorage` on mount and remove on unmount", () => {
    const testKey = "secret-key-123";
    mockUseParams.mockImplementation(() => ({ secretKey: testKey }));
    const { unmount } = renderWithRedux(<CustomerAreaPage />, testStore);
    // Should store secret key on mount
    () => expect(getSecretKey()).toEqual(testKey);
    // Should remove secret key on unmount
    unmount();
    expect(getSecretKey()).toEqual("");
  });

  test("should subscribe to all necessary firestore entries", () => {
    renderWithRedux(<CustomerAreaPage />, testStore);
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
    renderWithRedux(<CustomerAreaPage />, testStore);
    const saulRegex = new RegExp(`${saul.name} ${saul.surname}`);
    screen.getByText(saulRegex);
  });
});

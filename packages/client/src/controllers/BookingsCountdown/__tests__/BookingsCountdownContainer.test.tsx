/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test } from "vitest";
import { screen } from "@testing-library/react";
import { DateTime } from "luxon";

import i18n, { ActionButton } from "@eisbuk/translations";
import { OrgSubCollection } from "@eisbuk/shared";
import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";

import BookingsCountdownContainer from "../BookingsCountdownContainer";

import { getNewStore } from "@/store/createStore";
import {
  changeCalendarDate,
  setSystemDate,
  storeSecretKey,
} from "@/store/actions/appActions";

import { renderWithRedux } from "@/__testUtils__/wrappers";

import { saul } from "@eisbuk/testing/customers";
import { baseSlot } from "@eisbuk/testing/slots";

const mockDispatch = vi.fn();
vi.mock("react-redux", async () => {
  const rr = (await vi.importActual("react-redux")) as object;

  return {
    ...rr,
    useDispatch: () => mockDispatch,
  };
});

describe("BookingsCountdown", () => {
  test("should open a finalize bookings modal on 'Finalize' button click", () => {
    // Set up test state so that the second deadline is shown
    const testDate = DateTime.fromISO("2022-01-01");
    const month = testDate;
    const extendedDate = testDate.plus({ days: 2 }).toISODate();
    const store = getNewStore();
    store.dispatch(
      updateLocalDocuments(OrgSubCollection.Bookings, {
        [saul.secretKey]: { ...saul, extendedDate },
      })
    );
    // Set at least one slot to store as to not show the no-slots message
    store.dispatch(
      updateLocalDocuments(OrgSubCollection.SlotsByDay, {
        ["2022-01"]: {
          ["2022-01-01"]: {
            [baseSlot.id]: {
              ...baseSlot,
              date: "2022-01-01",
              categories: saul.categories,
            },
          },
        },
      })
    );
    store.dispatch(changeCalendarDate(month));
    store.dispatch(storeSecretKey(saul.secretKey));
    // Instead of mocking Date.now, we're passing the test date (as system date) directly
    store.dispatch(setSystemDate(testDate));
    // With test state set up, 'finalize' button should be in the screen for
    // provided 'month'
    renderWithRedux(<BookingsCountdownContainer />, store);
    screen.getByText(i18n.t(ActionButton.FinalizeBookings) as string).click();
    const wantModal = {
      component: "FinalizeBookingsDialog",
      props: expect.objectContaining({ customerId: saul.id, month }),
    };
    const mockDispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
    expect(mockDispatchCallPayload.component).toEqual(wantModal.component);
    expect(mockDispatchCallPayload.props).toEqual(wantModal.props);
  });
});

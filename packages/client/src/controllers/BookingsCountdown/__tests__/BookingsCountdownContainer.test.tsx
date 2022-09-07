/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen } from "@testing-library/react";
import { DateTime } from "luxon";

import i18n, { ActionButton } from "@eisbuk/translations";
import { OrgSubCollection } from "@eisbuk/shared";
import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";

import { ModalPayload } from "@/features/modal/types";

import BookingsCountdownContainer from "../BookingsCountdownContainer";

import { getNewStore } from "@/store/createStore";
import { changeCalendarDate } from "@/store/actions/appActions";
import { openModal } from "@/features/modal/actions";

import { renderWithRedux } from "@/__testUtils__/wrappers";

import { saul } from "@/__testData__/customers";
import { baseSlot } from "@/__testData__/slots";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

describe("BookingsCountdown", () => {
  test("should open a finalize bookings modal on 'Finalize' button click", () => {
    // Set up test state so that the second deadline is shown
    const testDate = DateTime.fromISO("2022-01-01");
    // In order to keep tests consistent we need to also mock the `Date.now`
    jest.spyOn(Date, "now").mockReturnValue(testDate.toMillis());
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
    // With test state set up, 'finalize' button should be in the screen for
    // provided 'month'
    renderWithRedux(<BookingsCountdownContainer />, store);
    screen.getByText(i18n.t(ActionButton.FinalizeBookings) as string).click();
    const wantModal: ModalPayload = {
      component: "FinalizeBookingsDialog",
      props: { customerId: saul.id, month },
    };
    expect(mockDispatch).toHaveBeenCalledWith(openModal(wantModal));
  });
});

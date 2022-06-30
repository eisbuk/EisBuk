/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen } from "@testing-library/react";
import { DateTime } from "luxon";

import i18n, { ActionButton } from "@eisbuk/translations";
import { OrgSubCollection } from "@eisbuk/shared";

import { ModalState } from "@/features/modal/types";

import BookingsCountdownContainer from "../BookingsCountdownContainer";

import { getNewStore } from "@/store/createStore";
import { updateLocalDocuments } from "@/react-redux-firebase/actions";
import { changeCalendarDate } from "@/store/actions/appActions";
import { getModal } from "@/features/modal/selectors";

import { renderWithRedux } from "@/__testUtils__/wrappers";

import { saul } from "@/__testData__/customers";

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
    store.dispatch(changeCalendarDate(month));
    // With test state set up, 'finalize' button should be in the screen for
    // provided 'month'
    renderWithRedux(<BookingsCountdownContainer />, store);
    screen.getByText(i18n.t(ActionButton.FinalizeBookings) as string).click();
    // Check that the modal state has been updated with appropriate values
    const wantModal: ModalState = {
      component: "FinalizeBookingsDialog",
      props: { customerId: saul.id, month },
    };
    const modal = getModal(store.getState());
    expect(modal).toEqual(wantModal);
  });
});

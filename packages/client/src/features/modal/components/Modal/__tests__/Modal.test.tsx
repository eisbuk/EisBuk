/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test } from "vitest";
import { screen } from "@testing-library/react";
import { DateTime } from "luxon";

import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import Modal from "../Modal";

import { openModal, popModal } from "@/features/modal/actions";

import { renderWithRedux } from "@/__testUtils__/wrappers";
import { createModalStoreFragment as getNewStore } from "@/features/modal/__testUtils__/store";

import { baseSlot } from "@eisbuk/test-data/slots";

// We're mocking the 'cancelBooking' thunk as it uses firebase package
// and we don't need the setup for this test
vi.mock("@/store/actions/bookingOperations", () => ({
  cancelBooking: () => {},
}));

describe("Modal", () => {
  const intervalCardProps = {
    ...baseSlot,
    interval: { startTime: "09:00", endTime: "10:00" },
  };
  const finalizeBookingsProps = {
    customerId: "test-customer",
    month: DateTime.now(),
  };

  describe("test rendering of modal stack", () => {
    test("should render a stack of modals", () => {
      const testStore = getNewStore();
      renderWithRedux(<Modal />, testStore);

      // Add first modal
      testStore.dispatch(
        openModal({
          id: "modal",
          component: "CancelBookingDialog",
          props: {
            ...intervalCardProps,
            secretKey: "12345",
          },
        })
      );

      // Should render the CancelBookingDialog modal
      screen.getByText(i18n.t(Prompt.CancelBookingTitle) as string);

      // Add second modal
      testStore.dispatch(
        openModal({
          id: "another-modal",
          component: "FinalizeBookingsDialog",
          props: {
            secretKey: "12345",
            customerId: "test-customer",
            month: DateTime.now(),
          },
        })
      );

      // Should render the FinalizeBookingsDialog modal on top of the first one
      screen.getByText(i18n.t(Prompt.CancelBookingTitle) as string);
      screen.getByText(i18n.t(Prompt.FinalizeBookingsTitle) as string);
    });

    test("should reflect LIFO closing of the modals", () => {
      // The setup is the same as the final state of previous test
      const testStore = getNewStore();
      renderWithRedux(<Modal />, testStore);
      testStore.dispatch(
        openModal({
          id: "modal",
          component: "CancelBookingDialog",
          props: { ...intervalCardProps, secretKey: "12345" },
        })
      );
      testStore.dispatch(
        openModal({
          id: "another-modal",
          component: "FinalizeBookingsDialog",
          props: { ...finalizeBookingsProps, secretKey: "12345" },
        })
      );

      const [closeCancelBookings, closeFinailzeBookings] = screen.getAllByText(
        i18n.t(ActionButton.Cancel) as string
      );

      // Close the top modal
      closeFinailzeBookings.click();
      screen.getByText(i18n.t(Prompt.CancelBookingTitle) as string);
      expect(
        screen.queryByText(i18n.t(Prompt.FinalizeBookingsTitle) as string)
      ).toBeFalsy();

      // Close the remaining modal
      closeCancelBookings.click();
      testStore.dispatch(popModal);
      expect(
        screen.queryByText(i18n.t(Prompt.CancelBookingTitle) as string)
      ).toBeFalsy();
      expect(
        screen.queryByText(i18n.t(Prompt.FinalizeBookingsTitle) as string)
      ).toBeFalsy();
    });
  });
});

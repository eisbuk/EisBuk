/**
 * @jest-environment jsdom-sixteen
 */
import React from "react";
import { cleanup, screen, render } from "@testing-library/react";

import { slotsLabels } from "@/config/appConfig";

import { SlotView } from "@/enums/components";

import SlotCard from "../SlotCard";

import * as bookingActions from "@/store/actions/bookingOperations";
import * as slotOperations from "@/store/actions/slotOperations";

import {
  dummySlot,
  __editSlotId__,
  __deleteSlotId__,
  __slotId__,
} from "../__testData__";
import { __slotFormId__ } from "@/__testData__/testIds";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
  /** We're mocking this not to fail tests including SlotForm (this will be returning newSlotTime as null) @TODO remove in the future */
  useSelector: () => null,
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ secretKey: "secret_key" }),
}));

/** @TODO remove this when the i18next is instantiated with tests */
jest.mock("i18next", () => ({
  ...jest.requireActual("i18next"),
  /** We're mocking this not to fail certain tests depending on this, but we're not testing the i18n values, so this is ok for now @TODO fix i18n in tests */
  t: () => "",
}));

describe("SlotCard", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("Smoke test", () => {
    test("should render properly", () => {
      render(<SlotCard {...dummySlot} />);
    });
  });

  describe("DurationsSection functionality", () => {
    const mockSubscribe = jest.spyOn(bookingActions, "subscribeToSlot");
    const mockUnsubscribe = jest.spyOn(bookingActions, "unsubscribeFromSlot");

    // we're mocking booking operations to return payload they've been called with rather than thunk
    // any assertion comes to explicitly say we're ok with returning a Record instead of async thunk
    mockSubscribe.mockImplementationOnce(
      (bookingId, bookingInfo) =>
        ({ action: "subscribe", bookingId, bookingInfo } as any)
    );
    mockUnsubscribe.mockImplementation(
      (bookingId, slotId) =>
        ({ action: "unsubscribe", bookingId, slotId } as any)
    );

    test("if clicked duration is not subscribed to, should subscribe to said duration and unsubscribe from any other duration", () => {
      // we're simulating a case where the customer is subscribed to first duration of the dummy slot
      const subscribedDuration = dummySlot.durations[0];
      render(
        <SlotCard {...dummySlot} subscribedDuration={subscribedDuration} />
      );
      const notSubscribedDuration = dummySlot.durations[1];
      const notSubscribedDurationLabel =
        slotsLabels.durations[notSubscribedDuration].label;
      screen.getByText(notSubscribedDurationLabel).click();
      expect(mockDispatch).toHaveBeenCalledWith({
        action: "subscribe",
        bookingId: "secret_key",
        bookingInfo: { ...dummySlot, duration: notSubscribedDuration },
      });
    });

    test("if clicked duration is subscribed to, should unsubscribe from said duration", () => {
      // we're simulating a case where the customer is subscribed to first duration of the dummy slot
      const subscribedDuration = dummySlot.durations[0];
      render(
        <SlotCard {...dummySlot} subscribedDuration={subscribedDuration} />
      );
      const subscribedDurationLabel =
        slotsLabels.durations[subscribedDuration].label;
      screen.getByText(subscribedDurationLabel).click();
      expect(mockDispatch).toHaveBeenCalledWith({
        action: "unsubscribe",
        bookingId: "secret_key",
        slotId: dummySlot.id,
      });
    });

    test("if admin view, clicking on durations won't have any effect", () => {
      // we're simulating a case where the customer is subscribed to first duration of the dummy slot
      render(<SlotCard {...dummySlot} view={SlotView.Admin} />);
      // click all of the buttons
      dummySlot.durations.forEach((duration) => {
        const durationLabel = slotsLabels.durations[duration].label;
        screen.getByText(durationLabel).click();
      });
      expect(mockDispatch).toHaveBeenCalledTimes(0);
    });
  });

  describe("SlotOperationButtons functionality", () => {
    // we're mocking the return of deleteSlots function for easier testing
    const mockDelete = jest.spyOn(slotOperations, "deleteSlots");
    mockDelete.mockImplementation((slots) => ({ slots } as any));

    beforeEach(() => {
      render(<SlotCard {...dummySlot} view={SlotView.Admin} enableEdit />);
    });

    test("should open slot form on edit slot click", () => {
      screen.getByTestId(__editSlotId__).click();
      screen.getByTestId(__slotFormId__);
    });

    test("should dispatch delete action on delete click", () => {
      screen.getByTestId(__deleteSlotId__).click();
      expect(mockDispatch).toHaveBeenCalledWith({ slots: [dummySlot] });
    });
  });

  describe("Test clicking on slot card", () => {
    const mockOnClick = jest.fn();

    test("should fire 'onClick' function if provided", () => {
      render(
        <SlotCard
          {...dummySlot}
          view={SlotView.Admin}
          enableEdit
          onClick={mockOnClick}
        />
      );
      screen.getByTestId(__slotId__).click();
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test("should not explode on click if no 'onClick' handler has been provided", () => {
      render(<SlotCard {...dummySlot} view={SlotView.Admin} enableEdit />);
      screen.getByTestId(__slotId__).click();
    });
  });
});

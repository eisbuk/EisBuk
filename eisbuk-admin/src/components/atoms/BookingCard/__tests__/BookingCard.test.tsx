/**
 * @jest-environment jsdom-sixteen
 */
import React from "react";
import { cleanup, render } from "@testing-library/react";

// import { Slot } from "eisbuk-shared";

// import { slotsLabels } from "@/config/appConfig";

// import { SlotView } from "@/enums/components";

import * as bookingActions from "@/store/actions/bookingOperations";
// import * as slotOperations from "@/store/actions/slotOperations";

import { __slotId__ } from "../__testData__/testIds";
import {
  __confirmDialogYesId__,
  __slotFormId__,
  __deleteButtonId__,
  __editSlotButtonId__,
} from "@/__testData__/testIds";
import { dummySlot } from "@/__testData__/dummyData";
import BookingCard from "../BookingCard";

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

describe("BookingCard", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("Smoke test", () => {
    test("should render properly", () => {
      render(<BookingCard {...dummySlot} />);
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

    // test("if clicked duration is not subscribed to, should subscribe to said duration and unsubscribe from any other duration", () => {
    //   // we're simulating a case where the customer is subscribed to first duration of the dummy slot
    //   const subscribedDuration = dummySlot.durations[0];
    //   render(
    //     <BookingCard {...dummySlot} subscribedDuration={subscribedDuration} />
    //   );
    //   const notSubscribedDuration = dummySlot.durations[1];
    //   const notSubscribedDurationLabel =
    //     slotsLabels.durations[notSubscribedDuration].label;
    //   screen.getByText(notSubscribedDurationLabel).click();
    //   expect(mockDispatch).toHaveBeenCalledWith({
    //     action: "subscribe",
    //     bookingId: "secret_key",
    //     bookingInfo: { ...dummySlot, duration: notSubscribedDuration },
    //   });
    // });

    // test("if clicked duration is subscribed to, should unsubscribe from said duration", () => {
    //   // we're simulating a case where the customer is subscribed to first duration of the dummy slot
    //   const subscribedDuration = dummySlot.durations[0];
    //   render(
    //     <BookingCard {...dummySlot} subscribedDuration={subscribedDuration} />
    //   );
    //   const subscribedDurationLabel =
    //     slotsLabels.durations[subscribedDuration].label;
    //   screen.getByText(subscribedDurationLabel).click();
    //   expect(mockDispatch).toHaveBeenCalledWith({
    //     action: "unsubscribe",
    //     bookingId: "secret_key",
    //     slotId: dummySlot.id,
    //   });
    // });

    // test("if calendar view, clicking on durations won't have any effect", () => {
    //   // we're simulating a case where the customer is subscribed to first duration of the dummy slot
    //   render(<BookingCard {...dummySlot} view={SlotView.Calendar} />);
    //   // click all of the buttons
    //   dummySlot.durations.forEach((duration) => {
    //     const durationLabel = slotsLabels.durations[duration].label;
    //     screen.getByText(durationLabel).click();
    //   });
    //   expect(mockDispatch).toHaveBeenCalledTimes(0);
    // });
  });

  //    describe("Test clicking on slot card", () => {
  //      const mockOnClick = jest.fn();

  //      test("should fire 'onClick' function if provided", () => {
  //        render(
  //          <BookingCard
  //            {...dummySlot}
  //            view={SlotView.Admin}
  //            enableEdit
  //            onClick={mockOnClick}
  //          />
  //        );
  //        screen.getByTestId(__slotId__).click();
  //        expect(mockOnClick).toHaveBeenCalledTimes(1);
  //      });

  //      test("should not explode on click if no 'onClick' handler has been provided", () => {
  //        render(<BookingCard {...dummySlot} view={SlotView.Admin} enableEdit />);
  //        screen.getByTestId(__slotId__).click();
  //      });
  //    });
});

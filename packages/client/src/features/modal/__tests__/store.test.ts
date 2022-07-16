import { DateTime } from "luxon";

import { getNewStore } from "@/store/createStore";
import { SlotInterface, SlotType } from "@eisbuk/shared";

import { ModalPayload } from "../types";

import { popModal, openModal } from "../actions";

import { getModal } from "../selectors";

const interval = {
  startTime: "09:00",
  endTime: "10:00",
};

const dummySlot: SlotInterface = {
  id: "slot",
  type: SlotType.Ice,
  categories: [],
  intervals: {
    "09:00-10:00": interval,
  },
  date: "2022-01-01",
};

const modal1: ModalPayload = {
  component: "CancelBookingDialog",
  props: { ...dummySlot, interval },
};

const modal2: ModalPayload = {
  component: "FinalizeBookingsDialog",
  props: { customerId: "dummy-cusotmer", month: DateTime.now() },
};

describe("Modal store tests", () => {
  describe("Open modal action", () => {
    test("should add modal to the store state with appropriate component and props", () => {
      const store = getNewStore();
      store.dispatch(openModal(modal1));
      let modalContent = getModal(store.getState());
      expect(modalContent).toEqual([modal1]);
      // If another modal added, should push it to the stack in state
      store.dispatch(openModal(modal2));
      modalContent = getModal(store.getState());
      expect(modalContent).toEqual([modal1, modal2]);
    });
  });

  describe("Close modal action", () => {
    test("should set the store state to 'null' effectively removing the modal from the screen", () => {
      // Test setup is the test above
      const store = getNewStore();
      store.dispatch(openModal(modal1));
      store.dispatch(openModal(modal2));
      // Close the top-most modal
      store.dispatch(popModal);
      let modalContent = getModal(store.getState());
      expect(modalContent).toEqual([modal1]);
      // Close the final modal
      store.dispatch(popModal);
      modalContent = getModal(store.getState());
      expect(modalContent).toEqual([]);
    });
  });
});

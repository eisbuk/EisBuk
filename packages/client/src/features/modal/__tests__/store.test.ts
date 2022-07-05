import { getNewStore } from "@/store/createStore";
import { SlotInterface, SlotType } from "@eisbuk/shared";

import { ModalState } from "../types";

import { closeModal, openModal } from "../actions";
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

const testPayload: ModalState<"CancelBookingDialog"> = {
  component: "CancelBookingDialog",
  props: { ...dummySlot, interval },
};

describe("Modal store tests", () => {
  describe("Open modal action", () => {
    test("should update the store state with appropriate component and props", () => {
      const store = getNewStore();
      store.dispatch(openModal(testPayload));
      const modalContent = getModal(store.getState());
      expect(modalContent).toEqual(testPayload);
    });
  });

  describe("Close modal action", () => {
    test("should set the store state to 'null' effectively removing the modal from the screen", () => {
      // Test setup is the test above
      const store = getNewStore();
      store.dispatch(openModal(testPayload));
      // Dispatch test action
      store.dispatch(closeModal);
      const modalContent = getModal(store.getState());
      expect(modalContent).toEqual(null);
    });
  });
});

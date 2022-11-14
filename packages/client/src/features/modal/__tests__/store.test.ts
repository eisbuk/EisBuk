import { DateTime } from "luxon";

import { getNewStore } from "@/store/createStore";
import { SlotInterface, SlotType } from "@eisbuk/shared";

import { ModalPayload } from "../types";

import {
  popModal,
  openModal,
  closeAllModals,
  closeModal,
  updateModal,
} from "../actions";

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
  id: "modal1",
  component: "CancelBookingDialog",
  props: { ...dummySlot, interval },
};

const modal2: ModalPayload = {
  id: "modal2",
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

    test("if the modal is already open, should fail with a warning", () => {
      const store = getNewStore();
      store.dispatch(openModal(modal1));
      store.dispatch(openModal(modal2));
      store.dispatch(
        openModal({
          ...modal1,
          props: { ...modal1.props, date: "2022-10-15" },
        })
      );
      const modalContent = getModal(store.getState());
      expect(modalContent).toEqual([modal1, modal2]);
    });
  });

  describe("Update modal action", () => {
    test("should update an existing modal in the store with the updated props", async () => {
      const store = getNewStore();
      store.dispatch(openModal(modal1));
      store.dispatch(openModal(modal2));
      let modalContent = getModal(store.getState());
      const updatedModal1 = {
        ...modal1,
        props: { ...modal1.props, date: "2022-10-14" },
      };
      store.dispatch(updateModal(updatedModal1));
      modalContent = getModal(store.getState());
      expect(modalContent).toEqual([updatedModal1, modal2]);
    });

    test("should fail silently if updated modal doesn't exist in open modals stack", () => {
      const store = getNewStore();
      store.dispatch(updateModal(modal1));
      const modalState = getModal(store.getState());
      expect(modalState).toEqual([]);
    });
  });

  describe("Close modal action", () => {
    test("should remove the specific modal from store state effectively removing the modal from the screen", () => {
      // Setup
      const store = getNewStore();
      store.dispatch(openModal(modal1));
      store.dispatch(openModal(modal2));
      // Close the first modal (by explicitly specifying its id)
      store.dispatch(closeModal(modal1.id));
      const modalContent = getModal(store.getState());
      expect(modalContent).toEqual([modal2]);
    });
  });

  describe("Pop modal action", () => {
    test("should pop the latest modal from store state effectively removing the modal from the screen", () => {
      // Setup
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

  describe("Close all modals action", () => {
    test("should remove all modals from the state, removing any modal from the screen", () => {
      // Setup
      const store = getNewStore();
      store.dispatch(openModal(modal1));
      store.dispatch(openModal(modal2));
      // Close the top-most modal
      store.dispatch(closeAllModals);
      const modalContent = getModal(store.getState());
      expect(modalContent).toEqual([]);
    });
  });
});

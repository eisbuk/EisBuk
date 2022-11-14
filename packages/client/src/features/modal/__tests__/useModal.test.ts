/**
 * @jest-environment jsdom
 */

import { SlotInterface, SlotType } from "@eisbuk/shared";
import * as reactRedux from "react-redux";

import { ModalPayload } from "../types";

import { getModal } from "../selectors";
import { getNewStore } from "@/store/createStore";

import { createModal } from "../useModal";

import { testHookWithRedux } from "@/__testUtils__/testHooksWithRedux";

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

const modal1: Omit<ModalPayload<"CancelBookingDialog">, "id"> = {
  component: "CancelBookingDialog",
  props: { ...dummySlot, interval },
};

describe("useModal hook", () => {
  test("should open a modal on open call", () => {
    const store = getNewStore();

    const useModal = createModal(modal1.component);
    const testRes = testHookWithRedux(store, useModal, modal1.props);

    // No modal is rendered yet, without running of the 'open' method
    let modalState = getModal(store.getState());
    expect(modalState).toEqual([]);

    // Fire 'open' to add the modal to the state
    testRes.result.open();

    modalState = getModal(store.getState());
    let modalProps = modalState[0].props;

    expect(modalState.length).toEqual(1);
    expect(modalProps).toEqual(modal1.props);

    // Update the props in the store
    const updatedProps = { ...modal1.props, date: "2022-10-15" };
    testRes.updateProps(updatedProps);

    modalState = getModal(store.getState());
    modalProps = modalState[0].props;

    expect(modalState.length).toEqual(1);
    expect(modalProps).toEqual(updatedProps);

    // Close the modal
    testRes.result.close();

    modalState = getModal(store.getState());
    expect(modalState.length).toEqual(0);
  });

  test("should open the modal with props explicitly passed in on 'openWithProps'", () => {
    const store = getNewStore();

    const useModal = createModal(modal1.component);
    const testRes = testHookWithRedux(store, useModal);

    testRes.result.openWithProps(modal1.props);

    const modalState = getModal(store.getState());
    expect(modalState.length).toEqual(1);
    expect(modalState[0].props).toEqual(modal1.props);
  });

  test("should not open the modal on 'open' call if props not passed in through hook call", () => {
    const store = getNewStore();

    const useModal = createModal(modal1.component);
    const testRes = testHookWithRedux(store, useModal);

    testRes.result.open();

    const modalState = getModal(store.getState());
    expect(modalState).toEqual([]);
  });

  test("should dispatch 'updateModal' only if the props aren't deeply equal", () => {
    const dispatchSpy = jest.fn();
    const useDispatchSpy = jest.spyOn(reactRedux, "useDispatch");
    useDispatchSpy.mockImplementation(() => dispatchSpy);

    const store = getNewStore();

    // Initialise useModal with 'modal1' props
    const useModal = createModal(modal1.component);
    const testRes = testHookWithRedux(store, useModal, modal1.props);
    testRes.result.open();

    // Clear previous calls to dispatch ('updateModal' on hook mount and 'openModal' on explicit call)
    dispatchSpy.mockClear();
    useDispatchSpy.mockImplementation(() => dispatchSpy);

    // Update props with the same structure (store shouldn't get updated)
    testRes.updateProps({ ...modal1.props });
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});

/**
 * @vitest-environment jsdom
 */

import { SlotInterface, SlotType } from "@eisbuk/shared";
import { describe, vi, expect, test } from "vitest";

import { ModalPayload } from "../types";

import { getModal } from "../selectors";
import { getNewStore } from "@/store/createStore";

import { createModal } from "../useModal";

import { testHookWithRedux } from "@/__testUtils__/testHooksWithRedux";
import { waitFor } from "@testing-library/react";

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
  props: { ...dummySlot, secretKey: "12345", interval },
};

const mockDispatch = vi.fn();
vi.mock("react-redux", async () => {
  const rr = (await vi.importActual("react-redux")) as object;

  return {
    ...rr,
    useDispatch: () => mockDispatch,
  };
});

describe("useModal hook", () => {
  test("should open a modal on open call", () => {
    const store = getNewStore();
    mockDispatch.mockImplementation(store.dispatch);

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
    mockDispatch.mockImplementation(store.dispatch);

    const useModal = createModal(modal1.component);
    const testRes = testHookWithRedux(store, useModal);

    testRes.result.openWithProps(modal1.props);

    const modalState = getModal(store.getState());
    expect(modalState.length).toEqual(1);
    expect(modalState[0].props).toEqual(modal1.props);
  });

  test("should not open the modal on 'open' call if props not passed in through hook call", () => {
    const store = getNewStore();
    mockDispatch.mockImplementation(store.dispatch);

    const useModal = createModal(modal1.component);
    const testRes = testHookWithRedux(store, useModal);

    testRes.result.open();

    const modalState = getModal(store.getState());
    expect(modalState).toEqual([]);
  });

  test("should dispatch 'updateModal' only if the props aren't deeply equal", () => {
    const store = getNewStore();
    mockDispatch.mockImplementation(store.dispatch);

    // Initialise useModal with 'modal1' props
    const useModal = createModal(modal1.component);
    const testRes = testHookWithRedux(store, useModal, modal1.props);
    testRes.result.open();

    // Clear previous calls to dispatch ('updateModal' on hook mount and 'openModal' on explicit call)
    mockDispatch.mockClear();

    // Update props with the same structure (store shouldn't get updated)
    testRes.updateProps({ ...modal1.props });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test("should call 'onClose' when the modal closes", async () => {
    const store = getNewStore();
    mockDispatch.mockImplementation(store.dispatch);

    const mockOnClose = vi.fn();

    // Initialise useModal with 'modal1' props
    const useModal = createModal(modal1.component);
    const testRes = testHookWithRedux(store, useModal, modal1.props, {
      onClose: mockOnClose,
    });
    testRes.result.open();

    // The modal has just been opened, so 'onClose' shouldn't have been called yet
    expect(mockOnClose).not.toHaveBeenCalled();

    // Close the modal
    testRes.result.close();
    await waitFor(() => expect(mockOnClose).toHaveBeenCalled());
  });
});

import { Reducer } from "redux";

import { ModalState, ModalReducerAction, ModalAction } from "./types";

/**
 * A reducer for modal state. Should be used to define a reducer for a property
 * `modal` in store. It controls modal functionality on app level. Any item can dispatch
 * against it, and a `Modal` component can be used (as a singleton) to render a modal.
 */
const modalReducer: Reducer<ModalState, ModalReducerAction> = (
  state = [],
  action
): ModalState => {
  switch (action.type) {
    // Add a modal to the top of the stack
    case ModalAction.Open:
      return [...state, action.payload];

    // Remove the modal with specified id from the stack
    case ModalAction.Close:
      return state.filter(({ id }) => id !== action.payload.id);

    // Pop the last modal from the stack
    case ModalAction.Pop:
      return state.slice(0, -1);

    // Empty the modal stack, effectively closing all of the modals
    case ModalAction.CloseAll:
      return [];

    default:
      return state;
  }
};

export default modalReducer;

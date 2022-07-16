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
    case ModalAction.Open:
      return [...state, action.payload];

    case ModalAction.Close:
      return state.slice(0, -1);

    default:
      return state;
  }
};

export default modalReducer;

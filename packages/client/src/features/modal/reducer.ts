import { Reducer } from "redux";

import { ModalState, ModalReducerAction } from "./types";

/**
 * A reducer for modal state. Should be used to define a reducer for a property
 * `modal` in store. It controls modal functionality on app level. Any item can dispatch
 * against it, and a `Modal` component can be used (as a singleton) to render a modal.
 */
const modalReducer: Reducer<ModalState, ModalReducerAction> = (
  state = null
): ModalState => state;

export default modalReducer;

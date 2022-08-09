import { ModalAction, ModalPayload, ModalReducerAction } from "./types";

/**
 * Open a modal by adding it to the modal stack in store, renering a specified component and passing appropriate props to it.
 * @param {Object} payload essentially a modal state passed to open up a modal
 * @param {string} payload.component name of a (whitelisted) component should be rendered inside a modal
 * @param {Object} payload.props appropriate props for the component rendered within modal
 */
export const openModal = (payload: ModalPayload): ModalReducerAction => ({
  type: ModalAction.Open,
  payload,
});

/**
 * This is a pure action object (not a function) dispatched
 * to pop the (top-most) modal from the modal stack
 */
export const popModal: ModalReducerAction = {
  type: ModalAction.Close,
};

/**
 * This is a pure action object (not a function) dispatched
 * to close an entire modal stack
 */
export const closeAllModals: ModalReducerAction = {
  type: ModalAction.CloseAll,
};

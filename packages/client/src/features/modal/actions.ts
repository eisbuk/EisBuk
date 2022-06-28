import { ModalAction, ModalReducerAction, ModalState } from "./types";

/**
 * Open a modal renering a specified component and pass appropriate props to it.
 * @param {Object} payload essentially a modal state passed to open up a modal
 * @param {string} payload.component name of a (whitelisted) component should be rendered inside a modal
 * @param {Object} payload.props appropriate props for the component rendered within modal
 */
export const openModal = (
  payload: NonNullable<ModalState>
): ModalReducerAction => ({
  type: ModalAction.Open,
  payload,
});

/**
 * This is a pure action object (not a function) dispatched
 * to close the modal
 */
export const closeModal: ModalReducerAction = {
  type: ModalAction.Close,
};

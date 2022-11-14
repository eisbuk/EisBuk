import { ModalAction, ModalPayload, ModalReducerAction } from "./types";

/**
 * Open a modal by adding it to the modal stack in store, renering a specified component and passing appropriate props to it.
 * @param {Object} payload id and modal props used to render the newly added modal
 * @param {string} payload.id uuid of the modal to add
 * @param {string} payload.component name of a (whitelisted) component should be rendered inside a modal
 * @param {Object} payload.props appropriate props for the component rendered within a modal
 */
export const openModal = (payload: ModalPayload): ModalReducerAction => ({
  type: ModalAction.Open,
  payload,
});

/**
 * Update the existing modal (we use this to update the props on the shown modal when external update happens)
 * @param {Object} payload id and props of the modal to update
 * @param {string} payload.id uuid of the modal to update
 * @param {string} payload.component name of a (whitelisted) component should be rendered inside a modal
 * @param {Object} payload.props appropriate props for the component rendered within modal
 */
export const updateModal = (payload: ModalPayload): ModalReducerAction => ({
  type: ModalAction.Update,
  payload,
});

/**
 * Delete a specific modal from the modal stack by specifying the modal's id.
 * @param {Object} payload
 * @param {string} payload.id id of the modal to remove from stack
 */
export const closeModal = (id: ModalPayload["id"]): ModalReducerAction => ({
  type: ModalAction.Close,
  payload: { id },
});

/**
 * This is a pure action object (not a function) dispatched
 * to pop the (top-most) modal from the modal stack
 */
export const popModal: ModalReducerAction = {
  type: ModalAction.Pop,
};

/**
 * This is a pure action object (not a function) dispatched
 * to close an entire modal stack
 */
export const closeAllModals: ModalReducerAction = {
  type: ModalAction.CloseAll,
};

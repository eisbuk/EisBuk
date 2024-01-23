import { ModalPayload, ModalState, WhitelistedComponents } from "./types";

/**
 * Global state can be arbitrary, but it should contain
 * modal state under `modal` property for these selectors to work properly
 */
interface GlobalStateFragment {
  modal: ModalState;
}

/**
 * Get modal state. This should only be used internally, so that the `Modal` component can
 * render properly.
 *
 * @returns all modals in redux state
 */
export const getModal = ({ modal }: GlobalStateFragment): ModalState => modal;

/**
 * Searches for a particular modal by ids id, if such exists
 *
 * @returns modal payload or undefined
 */
export const getModalById =
  <C extends WhitelistedComponents>(id: string) =>
  ({ modal }: GlobalStateFragment) =>
    modal.find((modal) => modal.id === id) as ModalPayload<C>;

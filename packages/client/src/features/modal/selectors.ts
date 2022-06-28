import { ModalState } from "./types";

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
 */
export const getModal = ({ modal }: GlobalStateFragment): ModalState => modal;

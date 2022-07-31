import { componentWhitelist } from "./components";

// #region component
export interface BaseModalProps {
  /**
   * Close the current modal (pop it from the stack)
   */
  onClose: () => void;
  /**
   * Close all open modals
   */
  onCloseAll: () => void;
  className?: string;
}

/**
 * A type alias for whitelisted components to avoid typing `keyof typeof ...`
 * each time.
 */
type WhitelistedComponents = keyof typeof componentWhitelist;

/**
 * This contraption returns appropriate prop interace for specified
 * component. Provided that the component is in the whitelist of components
 * that can be rendered inside the Modal
 */
type GetComponentProps<C extends WhitelistedComponents> = Omit<
  Parameters<typeof componentWhitelist[C]>[0],
  // Omit the 'onClose' handler as it is specified by the Modal component
  // and it shouldn't be stored in `modal` store state.
  // Same goes for "className" and "children" (which should never be passed to a modal component)
  "onCloseAll" | "onClose" | "className" | "children"
>;
// #endregion component

// #region Redux
export enum ModalAction {
  Open = "@@MODAL/OPEN",
  Close = "@@MODAL/CLOSE",
  CloseAll = "@@MODAL/CLOSE_ALL",
}

/**
 * This is some heavy ninjutsu which I won't even begin to try to explain.
 *
 * It essentially allows us to infer from `component` what should the `props` interface be,
 * rather then infering props as an intersection of all props for all whitelisted components.
 */
type ModalStateMap = {
  [C in WhitelistedComponents]: {
    /**
     * Component to render inside the modal component.
     */
    component: C;
    /**
     * Props to be passed to the component rendered inside the modal.
     */
    props: GetComponentProps<C>;
  };
};

/**
 * Payload for modal open: used to specify the modal variant and pass appropriate props.
 */
export type ModalPayload<
  C extends WhitelistedComponents = WhitelistedComponents
> = ModalStateMap[C];

/**
 * State for `modal` portion of the store - a stack of open modals.
 */
export type ModalState = ModalPayload[];

// There are only two variants to this type. If number of variants gets bigger,
// it can be extended to more generic types/lookups
export type ModalReducerAction =
  | {
      type: ModalAction.Close | ModalAction.CloseAll;
    }
  | { type: ModalAction.Open; payload: ModalPayload };
// #endregion Redux

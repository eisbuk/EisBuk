/* eslint-disable @typescript-eslint/ban-types */
import { componentWhitelist } from "./components";

// #region component
export type ModalProps<T = {}> = {
  /**
   * Close the current modal (pop it from the stack)
   */
  onClose: () => void;
  /**
   * Close all open modals
   */
  onCloseAll: () => void;
  /**
   * Updates self (the instance rendered) from inside the component code.
   * This is convenient if we want to communicate some state back to the caller opening the modal in the first place.
   *
   * @Note _This is optional to make it less tedious to test, but the handler will always be
   * passed from the Modal component._
   */
  onUpdateSelf?: (props: T) => void;
  className?: string;
} & T;

/**
 * A type alias for whitelisted components to avoid typing `keyof typeof ...`
 * each time.
 */
export type WhitelistedComponents = keyof typeof componentWhitelist;

/**
 * This contraption returns appropriate prop interace for specified
 * component. Provided that the component is in the whitelist of components
 * that can be rendered inside the Modal
 */
export type GetComponentProps<C extends WhitelistedComponents> = Omit<
  Parameters<(typeof componentWhitelist)[C]>[0],
  // Omit the 'onClose' handler as it is specified by the Modal component
  // and it shouldn't be stored in `modal` store state.
  // Same goes for "className" and "children" (which should never be passed to a modal component)
  "onCloseAll" | "onClose" | "onUpdateSelf" | "className" | "children"
>;
// #endregion component

// #region Redux
export enum ModalAction {
  Open = "@@MODAL/OPEN",
  Update = "@@MODAL/UPDATE",
  Close = "@@MODAL/CLOSE",
  Pop = "@@MODAL/POP",
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
     * A uuid of the modal (used later to close a specific modal or update props)
     */
    id: string;
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
// it can be extended to more generic types/lookup
export type ModalReducerAction =
  | {
      type: ModalAction.Pop | ModalAction.CloseAll;
    }
  | { type: ModalAction.Close; payload: Pick<ModalPayload, "id"> }
  | { type: ModalAction.Open | ModalAction.Update; payload: ModalPayload };
// #endregion Redux

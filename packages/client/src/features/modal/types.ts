import componentWhitelist from "./components";

export enum ModalAction {
  Open = "@@MODAL/OPEN",
  Close = "@@MODAL/CLOSE",
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
  "onClose"
>;

/**
 * State of `modal` portion of the store with `
 */
export type ModalState<
  V extends WhitelistedComponents = WhitelistedComponents
> = {
  /**
   * Component to render inside the modal component.
   */
  component: string;
  /**
   * Props to be passed to the component rendered inside the modal.
   */
  props: GetComponentProps<V>;
} | null;

// There are only two variants to this type. If number of variants gets bigger,
// it can be extended to more generic types/lookups
export type ModalReducerAction =
  | {
      type: ModalAction.Close;
    }
  | { type: ModalAction.Open; payload: NonNullable<ModalState> };

type UnknownObject = Record<string, unknown>;

export enum ModalAction {
  Open = "@@MODAL/OPEN",
  Close = "@@MODAL/CLOSE",
}

export type ModalState = Partial<{
  /**
   * Component to render inside the modal component.
   */
  component: string;
  /**
   * Props to be passed to the component rendered inside the modal.
   */
  props: UnknownObject;
}>;

// There are only two variants to this type. If number of variants gets bigger,
// it can be extended to more generic types/lookups
export type ModalReducerAction =
  | {
      type: ModalAction.Close;
    }
  | { type: ModalAction.Open; payload: ModalState };

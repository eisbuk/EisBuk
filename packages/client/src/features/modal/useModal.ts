import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuid } from "uuid";
import { isEqual } from "lodash";

import { WhitelistedComponents, GetComponentProps, ModalProps } from "./types";

import { getModalById } from "./selectors";

import { closeModal, openModal, updateModal } from "./actions";

/**
 * A function used to create a 'useModal' hook. We pass the `component` as a param
 * into the factory (as `component` shouldn't really change) throughout the lifetime of the hook.
 *
 * The hook handles opening of the modal with appropriate props and propagating the props update to the
 * modal open in store. The opening and closing is handled through methods returned from the hook.
 *
 * The props (for the modal to render) are passed either as a parameter to the hook call or though
 * `openWithProps` method.
 *
 * _note: props passed through `openWithProps` are passed imperatively to the open modal, while props passed
 * in hook call automaticaly pass updates to the component when the underlaying props get updated._
 * @example
 * ```
 * const useModal = createModal("some-whitelisted-component")
 * const { open, close, openWithProps } = useModal(initialProps)
 *
 * // open the modal with 'initialProps' passed to the rendered modal component
 * open()

 * // close the modal
 * close()

 * // open the modal with 'differentProps' passed to the rendered modal component
 * openWithProps(differentProps)
 * ```
 * @param component
 * @returns
 */
export const createModal = <C extends WhitelistedComponents>(component: C) => {
  const id = uuid();

  return (
    props?: GetComponentProps<C>,
    { onClose }: Partial<Pick<ModalProps, "onClose">> = {}
  ) => {
    // Keep track of last prop update in odred to do deep comparison
    // of props and dispatch 'updateModal' only when the props aren't deeply equal
    const lastUpdate = useRef<GetComponentProps<C> | undefined>();

    const dispatch = useDispatch();

    // Run 'onClose' if any when the modal closes
    useOnClose(id, onClose);

    // Update props of the modal in store (only if open)
    useEffect(() => {
      if (!props) {
        return;
      }
      // If updated props are the same as last update
      // don't propagate any updates
      if (isEqual(props, lastUpdate.current)) {
        return;
      }
      dispatch(updateModal({ id, component, props }));
      lastUpdate.current = props;
    }, [props]);

    const open = () => {
      if (!props) {
        console.warn(
          "Trying to open a modal without the props passed in. Pass the props to hook call, or use 'openWithProps' to pass props explicitly." +
            ` Opening dialog with component: ${component}`
        );
        return;
      }
      dispatch(openModal({ id, component, props }));
    };
    const openWithProps = (props: GetComponentProps<C>) => {
      dispatch(openModal({ id, component, props }));
    };
    const close = () => {
      dispatch(closeModal(id));
    };

    const state = useSelector(getModalById<C>(id));

    return {
      open,
      openWithProps,
      close,
      state,
    };
  };
};

const useOnClose = (id: string, onClose = () => {}) => {
  const isOpen = useRef(false);

  const modal = useSelector(getModalById(id));
  useEffect(() => {
    if (modal) {
      isOpen.current = true;
    }
    if (!modal && isOpen.current) {
      isOpen.current = false;
      onClose();
    }
  }, [modal]);
};

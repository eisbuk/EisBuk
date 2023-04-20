import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";

import { componentWhitelist } from "@/features/modal/components";

import { closeAllModals, popModal } from "@/features/modal/actions";
import { getModal } from "@/features/modal/selectors";

/**
 * Main component for the `modal` feature. I uses the state in store to render an appropriate
 * component in the modal, passing the props to it. It uses React portal to port the modal to
 * a div created to house the element and handles close functionality.
 */
const Modal: React.FC = () => {
  const dispatch = useDispatch();

  // A reference to a 'div' element created to house the modal element
  // We're using state rather than ref as updating the state on modal div element
  // creation will update the state triggering rerender, unlike ref updates
  const [modalContainer, setModalContainer] = useState<HTMLElement | null>(
    null
  );

  // Create a div to render the modal in
  useEffect(() => {
    if (!modalContainer) {
      // Check if modal div already exists to prevent
      // appending of multiple modal divs to the document
      let modalDiv = document.getElementById("modal");
      if (!modalDiv) {
        // Create a container to render the modal element in
        modalDiv = document.createElement("div");
        modalDiv.setAttribute("id", "modal");
        document.body.appendChild(modalDiv);
      }
      setModalContainer(modalDiv);
    }

    // Remove modal container from the DOM as a cleanup
    return () => {
      modalContainer && document.removeChild(modalContainer);
    };
  }, []);

  // If no modal content in store, don't return anything
  // and skip the following block
  const modal = useSelector(getModal);
  if (!modal.length) {
    return null;
  }

  const modals = modal;

  const handleClose = () => {
    dispatch(popModal);
  };
  const handleCloseAll = () => {
    dispatch(closeAllModals);
  };

  const content = (
    <ModalContainer onClose={handleClose}>
      {modals.map(({ component, props }, i) => {
        const Component = componentWhitelist[component];

        return (
          <Component
            key={`${component}-${i}`}
            {...(props as any)}
            onClose={handleClose}
            onCloseAll={handleCloseAll}
          />
        );
      })}
    </ModalContainer>
  );

  // Render a modal element in a different div ('id="modal"') then the app one
  // using React portal
  return modalContainer && ReactDOM.createPortal(content, modalContainer);
};

export const ModalContainer: React.FC<{ onClose?: () => void }> = ({
  children,
  onClose = () => {},
}) => (
  <div role="dialog" className="fixed top-0 right-0 bottom-0 left-0 z-[999999]">
    <div
      onClick={onClose}
      className="absolute top-0 right-0 bottom-0 left-0 bg-gray-800/50"
    />
    {children instanceof Array ? (
      // We need to split modal components if there are multiple in order to
      // apply the "centered" styling on each
      children.map((child) => (
        <div
          key={child.key}
          className="center-absolute bg-white rounded overflow-hidden shadow-2xl"
        >
          {child}
        </div>
      ))
    ) : (
      <div className="center-absolute">{children}</div>
    )}
  </div>
);

export default Modal;

import { ReducerFactory } from "@/types/store";

import { ModalState, ModalReducerAction, ModalAction } from "./types";

/**
 * A factory function returning a reducer for `modal` state.
 * It is created using a factory rather than just creating the reducer as a variable
 * to enable us to pass `initialState`
 *
 * The result hould be used to define a reducer for a property `modal` in store.
 * It controls modal functionality on app level. Any item can dispatch
 * against it, and a `Modal` component can be used (as a singleton) to render a modal.
 *
 * @param initialState (optional) state to be used as initial (fallback) state to the reducer. If not provided,
 * falls back to empty array.
 */
export const createModalReducer: ReducerFactory<
  ModalState,
  ModalReducerAction
> =
  (initialState = []) =>
  (state = initialState, action) => {
    switch (action.type) {
      // Add a modal to the top of the stack
      case ModalAction.Open: {
        // Check if the modal already exists
        const modalIndex = state.findIndex(
          ({ id }) => id === action.payload.id
        );
        if (modalIndex !== -1) {
          console.warn(
            "Modal to open already exists in the state.",
            "This is a no-op, but it might not have been what you've indented, consider using 'updateModal' instead if you wish to update modal props",
            "Updated modal",
            action.payload
          );
          return state;
        }

        // If modal not already open, add it to the end of the stack
        return [...state, action.payload];
      }

      // Update the existing (open) modal
      case ModalAction.Update: {
        const modalIndex = state.findIndex(
          ({ id }) => id === action.payload.id
        );

        // If modal not found, exit silently
        if (modalIndex === -1) {
          return state;
        }

        const safeState = [...state];
        safeState[modalIndex] = action.payload;
        return safeState;
      }

      // Remove the modal with specified id from the stack
      case ModalAction.Close: {
        return state.filter(({ id }) => id !== action.payload.id);
      }

      // Pop the last modal from the stack
      case ModalAction.Pop: {
        return state.slice(0, -1);
      }

      // Empty the modal stack, effectively closing all of the modals
      case ModalAction.CloseAll: {
        return [];
      }

      default: {
        return state;
      }
    }
  };

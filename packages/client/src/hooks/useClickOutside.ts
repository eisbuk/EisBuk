/** @DUPLICATE_FILE @eisbuk/ui/src/hooks/useClickOutside.ts */
import { useEffect, RefObject } from "react";

interface ClickCallback {
  (e: Event): any;
}

interface ClickOutsideHook {
  (ref: RefObject<HTMLElement>, callback: ClickCallback): void;
}

/**
 * Hook used to control event listeners in service of enabling
 * the closing of the modal on click anywhere other than the provided element (modal)
 * @param ref of an element
 * @param callback to run on outside click
 */
const useClickOutside: ClickOutsideHook = (ref, callback) => {
  useEffect(() => {
    const listener: EventListener = (e) => {
      if (!ref || ref.current?.contains(e.target as Node)) {
        return;
      }

      callback(e);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};

export default useClickOutside;

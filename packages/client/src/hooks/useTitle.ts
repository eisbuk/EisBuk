import { useEffect } from "react";

/**
 * A simple hook used to set the (html) title of the document.
 * Written as a hook to avoid setting the date on each render (in case of a function).
 * As a cleanup, reverts title to previous one
 * @param title
 */
const useTitle = (title: string): void => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

export default useTitle;

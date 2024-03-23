import { useSelector, useDispatch } from "react-redux";

import { getSystemDate } from "@/store/selectors/app";
import { useEffect, useRef } from "react";
import { resetSystemDate } from "@/store/actions/appActions";

/**
 * A hook used at top level of the app to make sure the system date entry in store gets
 * updated each time the actual date changes:
 * - if not in debug mode, the system date will be updated each time the day changes
 * - if in debug mode, the system date will be updated only when the debug mode is turned off
 */
const useSystemDate = () => {
  const dispatch = useDispatch();
  const { value: date, debug } = useSelector(getSystemDate);

  const timeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear timeout (if exists) each time as either:
    //  - the new one will be set
    //  - we won't be using auto-reset (debug mode)
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    // If not in debug mode, we would like for the system date to be updated
    // when the day changes
    if (!debug) {
      timeout.current = setTimeout(() => {
        // We're not explicitly setting the system date here, merely resetting the sys date
        // and allowing the reducer to calculate the correct value
        dispatch(resetSystemDate());
      }, date.plus({ days: 1 }).startOf("day").diffNow().milliseconds + 1);
    }
  }, [date, debug]);
};

export default useSystemDate;

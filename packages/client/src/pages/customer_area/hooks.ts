import { useEffect } from "react";
import { DateTime } from "luxon";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { CalendarNavProps } from "@eisbuk/ui";

import { getCalendarDay } from "@/store/selectors/app";
import {
  changeCalendarDate,
  removeSecretKey,
  storeSecretKey,
} from "@/store/actions/appActions";

/**
 * Secret key logic abstracted away in a hook for easier readability
 */
export const useSecretKey = () => {
  // Secret key is provided as a route param to the customer_area page
  const { secretKey } = useParams<{
    secretKey: string;
  }>();
  const dispatch = useDispatch();

  // Store secretKey to redux store
  // for easier access
  useEffect(() => {
    dispatch(storeSecretKey(secretKey));

    return () => {
      // remove secretKey from local storage on unmount
      dispatch(removeSecretKey);
    };
  }, [secretKey]);

  return secretKey;
};

/**
 * Date logic abstracted away in a hook for readability.
 * Reads current date from Redux store and handles updates of the current date.
 * The returned structure can directly be passed as props to CalendarNav component
 */
export const useDate = (): Pick<CalendarNavProps, "date" | "onChange"> => {
  const dispatch = useDispatch();

  const date = useSelector(getCalendarDay);
  const onChange = (date: DateTime) => dispatch(changeCalendarDate(date));

  return { date, onChange };
};

import { DateTime } from "luxon";
import { useDispatch, useSelector } from "react-redux";

import { CalendarNavProps } from "@eisbuk/ui";

import { getCalendarDay } from "@/store/selectors/app";
import { changeCalendarDate } from "@/store/actions/appActions";

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

import { DateTime } from "luxon";

import { Action } from "@/enums/store";

import { AppReducerAction } from "@/types/store";

/**
 * Creates Redux action for appReducer to update calendar date
 * @param date calendar date to set
 * @returns Redux action object
 */
export const changeCalendarDate = (
  date: DateTime
): AppReducerAction<Action.ChangeDay> => ({
  type: Action.ChangeDay,
  payload: date,
});

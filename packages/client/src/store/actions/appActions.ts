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

/**
 * Creates Redux action for appReducer to store customer's secret key
 * for easier access.
 * @param secretKey customer's secret key
 * @returns Redux action object
 */
export const storeSecretKey = (
  secretKey: string
): AppReducerAction<Action.StoreSecretKey> => ({
  type: Action.StoreSecretKey,
  payload: secretKey,
});

/**
 * A plain action object, removes secret key stored
 * in app section of local store
 */
export const removeSecretKey: AppReducerAction<Action.RemoveSecretKey> = {
  type: Action.RemoveSecretKey,
};

/**
 * Creates Redux action for appReducer to set system datre
 * @param date calendar date to set
 * @returns Redux action object
 */
export const setSystemDate = (
  date: DateTime
): AppReducerAction<Action.SetSystemDate> => ({
  type: Action.SetSystemDate,
  payload: date,
});

/**
 * Creates Redux action for appReducer to reset system datre
 * @param date calendar date to set
 * @returns Redux action object
 */
export const resetSystemDate =
  (): AppReducerAction<Action.ResetSystemDate> => ({
    type: Action.ResetSystemDate,
  });

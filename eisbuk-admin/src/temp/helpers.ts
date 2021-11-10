/**
 * This is a temp `react-redux-firebase`-like `isEmpty` function.
 * @TEMP checks input if not falsy or empty object/array
 * @TODO update when we're updating `isEmpty` and `isLoaded` functions
 */
export const isEmpty = (input: unknown): boolean =>
  input instanceof Object && input !== null && Object.values(input).length > 0;

/**
 * This is a temp `react-redux-firebase`-like `isEmpty` function.
 * @TEMP checks input if not falsy or empty object/array
 * @TODO update when we're updating `isEmpty` and `isLoaded` functions
 */
export const isEmpty = (input: unknown): boolean => {
  const isObject = input instanceof Object;
  const notNull = input !== null;
  const hasItems = Object.values((input as any) || {}).length > 0;

  return !(isObject && notNull && hasItems);
};

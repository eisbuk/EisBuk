/** Iterates over the object and trims all string values (if any) */
export const trimStringValues = <O extends Record<string, any>>(obj: O) =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  ) as O;

import { ID } from "./generators";

/** */
export function composeCompare<T>(
  ...comparators: Array<(a: T, b: T) => number>
) {
  return (a: T, b: T) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}

export function asc<C extends string | number>(): (a: C, b: C) => number;
export function asc<C extends string | number, T>(
  transform: (x: T) => C
): (a: T, b: T) => number;
/** */
export function asc<C extends string | number, T>(transform?: (x: T) => C) {
  return (a: T, b: T) => {
    const _transform = transform || ID<T>;
    const _a = _transform(a);
    const _b = _transform(b);

    return _a < _b ? -1 : _a > _b ? 1 : 0;
  };
}

export function desc<C extends string | number>(): (a: C, b: C) => number;
export function desc<C extends string | number, T>(
  transform: (x: T) => C
): (a: T, b: T) => number;
/** */
export function desc<C extends string | number, T>(transform?: (x: T) => C) {
  return (a: T, b: T) => {
    const _transform = transform || ID<T>;
    const _a = _transform(a);
    const _b = _transform(b);

    return _a > _b ? -1 : _a < _b ? 1 : 0;
  };
}

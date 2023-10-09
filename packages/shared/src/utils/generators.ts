type ReusableGenerator<T> = {
  [Symbol.iterator]: () => Generator<T>;
};

/** */
export function map<T, R>(
  iterable: Iterable<T>,
  mapper: (value: T) => R
): ReusableGenerator<R> {
  return iterableFromGenerator(function* () {
    for (const value of iterable) {
      yield mapper(value);
    }
  });
}

/** */
export function flatMap<T, R>(
  iterable: Iterable<T>,
  mapper: (value: T) => Iterable<R>
): ReusableGenerator<R> {
  return iterableFromGenerator(function* () {
    for (const value of iterable) {
      yield* mapper(value);
    }
  });
}

/** */
export function _groupIf<T>(
  iterable: Iterable<T>,
  predicate: (a: T, b: T) => boolean
): Iterable<Iterable<T>> {
  return iterableFromGenerator(function* () {
    let arr = [] as T[];
    for (const value of iterable) {
      if (arr.length === 0 || predicate(arr[0], value)) {
        arr.push(value);
      } else {
        yield arr;
        arr = [value];
      }
    }
  });
}

/** */
export function _group<T, K, V>(
  iterable: Iterable<T>,
  selector: (entry: T) => [K, V]
): Iterable<[K, Iterable<V>]> {
  const map = new Map<K, V[]>();
  const add = (key: K, value: V) =>
    map.get(key)?.push(value) || map.set(key, [value]);
  for (const entry of iterable) {
    add(...selector(entry));
  }
  return wrapIter([...map]);
}

export function filter<T, S extends T>(
  iterable: Iterable<T>,
  predicate: (value: T) => value is S
): ReusableGenerator<S>;
export function filter<T>(
  iterable: Iterable<T>,
  predicate: (value: T) => boolean
): ReusableGenerator<T>;
/** */
export function filter<T>(
  iterable: Iterable<T>,
  predicate: (value: T) => boolean
): ReusableGenerator<T> {
  return iterableFromGenerator(function* () {
    for (const value of iterable) {
      if (predicate(value)) {
        yield value;
      }
    }
  });
}

/** */
export function slice<T>(
  iterable: Iterable<T>,
  start: number,
  end: number
): ReusableGenerator<T> {
  return iterableFromGenerator(function* () {
    const iterator = iterable[Symbol.iterator]();

    let i = 0;

    while (i < end) {
      // If end out of bounds, simply stop
      const { value, done } = iterator.next();
      if (done && value === undefined) {
        break;
      }

      if (i >= start) {
        yield iterable[i];
      }

      i++;
    }
  });
}

/** */
export function zip<A extends readonly Iterable<unknown>[]>(
  ...iterables: A
): ReusableGenerator<{
  [K in keyof A]: A[K] extends Iterable<infer T> ? T : never;
}> {
  return iterableFromGenerator(function* () {
    const iterators = iterables.map((iterable) => iterable[Symbol.iterator]());
    while (true) {
      const results = iterators.map((iterator) => iterator.next());

      // Run the loop until all iterators are done
      if (results.every((result) => result.done)) {
        break;
      }

      yield results.map((result) => result.value) as any;
    }
  });
}

/** */
export class EmptyIterableError extends Error {
  /** */
  constructor() {
    super("Cannot reduce empty iterable without seed");
  }
}

export function _reduce<T, R>(
  iterable: Iterable<T>,
  reducer: (accumulator: R, value: T) => R,
  seed: R
): R;
export function _reduce<T>(
  iterable: Iterable<T>,
  reducer: (accumulator: T, value: T) => T,
  seed?: T
): T;
/** */
export function _reduce<T>(
  iterable: Iterable<T>,
  reducer: (accumulator: T, value: T) => T,
  seed: T
): T {
  const iterator = iterable[Symbol.iterator]();

  // If iterable empty, fall back to seed (if provided), if no seed throw an error
  // Note: We're acquring a new iterator here, not to mess with the one used for processing
  const { done: isEmpty } = iterable[Symbol.iterator]().next();
  if (isEmpty) {
    if (seed === undefined) {
      throw new EmptyIterableError();
    }
    return seed;
  }

  let accumulator = seed ?? iterator.next().value;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = iterator.next();
    if (done && value === undefined) {
      break;
    }
    accumulator = reducer(accumulator, value);
  }

  return accumulator;
}

/**
 * Iterable from generator produces an iterable from a generator function.
 * The created iterable can be reused (as opposed to a generator) as it's `[Symbol.iterator]` is the generator function
 * (returning a new generator each time it's called).
 *
 * Unlike other forms of Iterables it holds no internal structures (other than the generator function) and merely references
 * the structures used by the generator function (if any).
 * @param genFn
 * @returns
 */
export function iterableFromGenerator<T>(
  genFn: () => Generator<T>
): ReusableGenerator<T> {
  return {
    [Symbol.iterator]: genFn,
  };
}

interface TransformableIterable<T> extends Iterable<T> {
  map<R>(mapper: (value: T) => R): TransformableIterable<R>;
  flatMap<R>(bind: (value: T) => Iterable<R>): TransformableIterable<R>;
  _groupIf(
    predicate: (a: T, b: T) => boolean
  ): TransformableIterable<Iterable<T>>;
  _group<K, V>(
    selector: (a: T) => [K, V]
  ): TransformableIterable<[K, Iterable<V>]>;
  filter<S extends T>(
    predicate: (value: T) => value is S
  ): TransformableIterable<S>;
  filter(predicate: (value: T) => boolean): TransformableIterable<T>;
  slice(start: number, end: number): TransformableIterable<T>;
  zip<A extends readonly Iterable<unknown>[]>(
    ...iterables: A
  ): TransformableIterable<
    [T, ...{ [K in keyof A]: A[K] extends Iterable<infer E> ? E : never }]
  >;
  _reduce<R>(reducer: (accumulator: R, value: T) => R, seed: R): R;
  _reduce(reducer: (accumulator: T, value: T) => T, seed?: T): T;
  _array(): T[];
}

/**
 * Wrap an iterable with a set of transformation methods akin to array methods.
 * The api (call signatures) is the same as with array methods, but each method returns a new iterable
 * instead of an array (The iterable is not evaluated until it's iterated over).
 *
 * The returned iterable is already wrapped with the same set of methods, allowing for chaining (like in the array methods api).
 *
 * _Note: under the hood, the transformations are implemented using generator functions, but the returned iterable is reusable (as opposed to a generator)_
 *
 * _Note: if the input iterable contains any additional methods (e.g. a Map), they will be lost, as `wrapIter` takes in only the `[Symbol.iterator]` from the input._
 *
 * _Note: most of the methods are implemented with "pure" generators - only the instruction is stored, not the entire underlaying iterable structure and the iteration takes place
 * only when the pipeline is "materialised" (e.g. `[...iter]` - spreading the iterable to form an array). However, some methods aren't as "pure" - they iterate over the previous iterable
 * and/or store some internal replresentation of the underlaying structure, at the point of creation, and then yield the internal structure down the pipeline when the pipeline is
 * materialised - those methods are prepended with `_` (e.g. `_array`)_
 *
 * @example
 * ```ts
 * // Using array as an example, but the same applies to all types that implement the iterable interface
 * const iterable = wrapIter([1, 2, 3])
 * const result = iterable
 *   .map(mapper)
 *   .flatMap(flatMapper)
 *   .filter(predicate)
 *   ._reduce(reducer, seed);
 * ```
 */
export const wrapIter = <T>(
  iterable: Iterable<T>
): TransformableIterable<T> => {
  const m = <R>(mapper: (value: T) => R) => wrapIter(map(iterable, mapper));
  const fm = <R>(mapper: (value: T) => Iterable<R>) =>
    wrapIter(flatMap(iterable, mapper));
  const _gi = (predicate: (a: T, b: T) => boolean) =>
    wrapIter(_groupIf(iterable, predicate));
  const _gb = <K, V>(selector: (entry: T) => [K, V]) =>
    wrapIter(_group(iterable, selector));
  const f = (predicate: (value: T) => boolean) =>
    wrapIter(filter(iterable, predicate));
  const s = (start: number, end: number) =>
    wrapIter(slice(iterable, start, end));
  const z = <A extends readonly Iterable<unknown>[]>(...iterables: A) =>
    wrapIter(zip(iterable, ...iterables));

  const _r = (reducer: (accumulator: T, value: T) => T, seed?: T) =>
    _reduce(iterable, reducer, seed);

  return {
    // If we pass a Map, Map.prototype.entries() or Object.entries(object) (which are all iterable)
    // and take their [Symbol.iterator], this doesn't work...
    //
    // TODO: This is a quick hack to make it work, but it's not ideal, INVESTIGATE further
    [Symbol.iterator]: map(iterable, ID)[Symbol.iterator],
    map: m,
    flatMap: fm,
    _groupIf: _gi,
    _group: _gb,
    filter: f,
    slice: s,
    _reduce: _r,
    zip: z,
    _array: () => Array.from(iterable),
  };
};

// #region utils

/** Identity function */
export const ID = <T>(a: T): T => a;

/**
 * A HOF accepting a key mapper function, returning a mapper (for [K, V] pair) that applies the key mapper to the key, leaving the value intact
 * @example
 * const arr = [[1, 2], [3, 4]];
 * arr.map(keyMapper(k => "foo-" + k)) // [["foo-1", 2], ["foo-3", 4]]
 */
export const keyMapper =
  <K, V, T>(mapper: (key: K) => T) =>
  ([key, value]: [K, V]) =>
    [mapper(key), value] as [T, V];

/**
 * A HOF accepting a value mapper function, returning a mapper (for [K, V] pair) that applies the value mapper to the value, leaving the key intact
 * @example
 * const arr = [[1, 2], [3, 4]];
 * arr.map(valueMapper(v => ({ foo: v }))) // [[1, { foo: 2 }], [3, { foo: 4 }]
 */
export const valueMapper =
  <K, V, R>(mapper: (value: V) => R) =>
  ([key, value]: [K, V]) =>
    [key, mapper(value)] as [K, R];

/**
 * A HOF accepting an object and returning a mapper (for object types) that merges the object with the input object.
 * @example
 * const arr = [
 *  { foo: 1, bar: 2 },
 *  { foo: 3, bar: 4 },
 * ]
 * arr.map(mergeMapper({ fizz: "buzz" }))
 * // Res [
 * //   { foo: 1, bar: 2, fizz: "buzz" },
 * //   { foo: 3, bar: 4, fizz: "buzz" }
 * // ]
 */
export const mergeMapper =
  <A extends Record<string, any>>(a: A) =>
  <B extends Record<string, any>>(b: B): B & A => ({ ...a, ...b });

// #endregion utils

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */

/**
 * This file contains custom made utility types for overall usage.
 */

/**
 * Similar to `Partial<T>`, but `PickPartial<T, K>` makes only the K keys
 * optional, leaving the rest as in the original T.
 */
export type PickPartial<
  R extends Record<string, any>,
  K extends keyof R
> = Partial<Pick<R, K>> & Omit<R, K>;

/**
 * Similar to `Required<T>`, but `PickRequired<T, K>` makes only the K keys
 * required, leaving the rest as in the original T.
 */
export type PickRequired<
  R extends Record<string, any>,
  K extends keyof R
> = Required<Pick<R, K>> & Omit<R, K>;

// #region
type AllKeys<T> = T extends any ? keyof T : never;
type OptionalKeys<T> = T extends any
  ? {
      [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
    }[keyof T]
  : never;
type Idx<T, K extends PropertyKey, D = never> = T extends any
  ? K extends keyof T
    ? T[K]
    : D
  : never;

/**
 * This witchcraft is a copy/paste from StackOverflow:
 * https://stackoverflow.com/questions/60114191/typescript-union-type-to-deep-intersection-of-optional-values-difficulty-leve
 *
 * What it does is: it enables us to create an intersection type from a union type, going
 * recursively through all of the properties and "merging" them.
 *
 * @example
 * ```typescript
 * type Union = { foo: string } | { foo: number, bar: number };
 * type Intersection = MergeUnion<Union>; // { foo: string | number, bar?: number }
 * ```
 */
export type MergeUnion<T> = [T] extends [Array<infer E>]
  ? { [K in keyof T]: MergeUnion<T[K]> }
  : [T] extends [object]
  ? PickPartial<
      { [K in AllKeys<T>]: MergeUnion<Idx<T, K>> },
      Exclude<AllKeys<T>, keyof T> | OptionalKeys<T>
    >
  : T;

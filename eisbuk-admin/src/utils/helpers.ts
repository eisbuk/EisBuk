import { useEffect } from "react";
import { DateTime } from "luxon";
import { Timestamp } from "@google-cloud/firestore";

// ***** Region Simple Helpers ***** //
/**
 * Returns initials from provided name and last name
 * @param name
 * @param surname
 * @returns
 */
export const getInitials = (name: string, surname: string): string =>
  `${name[0]}${surname[0]}`;

interface CheckIndex {
  <V>(value: V, index: number, origArray: Array<V>): boolean;
}

/**
 * Checks for provided value and index match the first occurrence of the said value in provided array
 * @param value to match
 * @param index of the value to check
 * @param origArray
 * @returns
 */
export const onlyUnique: CheckIndex = (value, index, origArray) =>
  origArray.indexOf(value) === index;
// ***** End Region Simple Helpers ***** //

/**
 * Convert a firestore date to a luxon date
 * currently ignores microseconds since seconds are already
 * more than enough for our use case
 * @param fsdate
 * @returns
 */
export const fs2luxon = (fsdate: Timestamp): DateTime =>
  DateTime.fromMillis(fsdate.seconds * 1000);

// ***** Region To Flatten ***** //
interface ToFlatten {
  (toFlatten: Record<string, any>[]): Record<string, any>;
}

/** @TODO This should maybe be called merge, since it essentially merges two or more objects, rather then flattening (lowering depth of object by one level) */
/**
 * Flatten a list of objects, i.e. return an obect with all properties
 * from all objects in the list. If a property is defined inside two objects
 * the last one will prevail
 * @param toFlatten a list of objects to merge
 * @returns one object as a result of merging all the objects from the toFlatten list
 */
export const flatten: ToFlatten = (toFlatten) =>
  !toFlatten
    ? {}
    : toFlatten.reduce((partial, el) => ({ ...partial, ...el }), {});
// ***** End Region To Flatten ***** //

// ***** Region Get Month String ***** //
interface GetMonthString {
  (startDate: DateTime, offset: number): unknown;
}

/**
 * Returns a string representing the month starting from startDate
 * and moving by offset.
 * getMonthStr(luxon`2021-01-02`, -1) → "2020-12"
 * @param startDate
 * @param offset
 * @returns
 */
export const getMonthStr: GetMonthString = (startDate, offset) =>
  startDate
    .startOf("month")
    .plus({ months: offset })
    .toISODate()
    .substring(0, 7);
// ***** End Region Get Month String ***** //

/** @TODO this should be in a separate file at least, since it is a simple hook, rather then a function */
// ***** Region Use Title ***** //
/**
 * A hook used to set the (html) title of the document
 * @param title
 */
export const useTitle = (title: string): void => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};
// ***** End Region Use Title ***** //

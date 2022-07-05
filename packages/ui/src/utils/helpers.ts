/**
 * To be used as a callback to an `Array.protorype.sort` function.
 *
 * Sorts slot interval strings so that the intervals with highest duration come first.
 * Intervals with the same duration are sorted chronologically.
 */
export const sortIntervals = (a: string, b: string) => {
  const getDurationMinutes = (intervalStr: string) =>
    intervalStr
      // Split start and end time
      .split("-")
      .reduce(
        // Calculate difference (in minutes) of end time - start time
        (acc, curr) =>
          curr
            .split(":")
            .reduce(
              (acc, curr, i) => acc + (i ? Number(curr) : Number(curr) * 60),
              0
            ) - acc,
        0
      );

  const [durationA, durationB] = [a, b].map((interval) =>
    getDurationMinutes(interval)
  );

  return durationA > durationB
    ? -1
    : durationA < durationB
    ? 1
    : a > b
    ? 1
    : -1;
};

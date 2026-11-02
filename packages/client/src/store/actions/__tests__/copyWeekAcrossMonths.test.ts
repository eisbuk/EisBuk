import { describe, expect, test, vi } from "vitest";
import { DateTime } from "luxon";

import { copySlotsWeek, setSlotWeekToClipboard } from "../copyPaste";

describe("copySlotsWeek", () => {
  test("should copy the days of both months if the week spans two months", async () => {
    const december = { id: "december", date: "2021-12-27" };
    const january = { id: "january", date: "2022-01-01" };
    const calendarDay = DateTime.fromISO("2022-01-01");
    const dispatch = vi.fn();

    const getState = () => ({
      app: { calendarDay },
      firestore: {
        data: {
          slotsByDay: {
            "2021-12": { "2021-12-27": { december } },
            "2022-01": { "2022-01-01": { january } },
          },
        },
      },
    });
    await copySlotsWeek()(dispatch, getState as any, {} as any);

    expect(dispatch).toHaveBeenCalledWith(
      setSlotWeekToClipboard({
        slots: [december, january] as any,
        weekStart: calendarDay.startOf("week"),
      }),
    );
  });
});

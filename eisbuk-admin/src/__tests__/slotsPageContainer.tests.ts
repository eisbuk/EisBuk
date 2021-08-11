import { getDatesToDisplay } from "@/utils/slots";
import { DateTime } from "luxon";

it("Selects the app date", () => {
  const date = DateTime.local(2021, 8, 11);
  expect(getDatesToDisplay(date)).toEqual([
    "2021-08-11",
    "2021-08-12",
    "2021-08-13",
    "2021-08-14",
    "2021-08-15",
    "2021-08-16",
    "2021-08-17",
  ]);
});
